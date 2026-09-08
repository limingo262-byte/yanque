package com.bear.mcp.single.core.tools;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/** Read-only source inspection for log analysis. */
@Component
public class RepositoryCommandTools {
    private static final Set<String> ALLOWED_COMMANDS = Set.of("rg", "sed", "nl", "head", "tail", "wc");
    private static final Set<String> ALLOWED_REPOSITORIES = Set.of("yanque-admin");
    private static final Pattern SAFE_REPOSITORY = Pattern.compile("[a-zA-Z0-9._-]{1,80}");
    private static final int MAX_OUTPUT_CHARS = 30_000;
    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    private final Path repositoryRoot;

    public RepositoryCommandTools(@Value("${bear.repositories.root:/data/repositories}") String root) {
        this.repositoryRoot = Path.of(root).toAbsolutePath().normalize();
    }

    @Tool(name = "run_repository_command", description = "在已配置的只读源码仓库中执行 rg、sed、nl、head、tail 或 wc，用于根据日志堆栈定位代码。禁止修改文件、绝对路径和目录越界。")
    public Map<String, Object> runRepositoryCommand(
            @ToolParam(description = "仓库名称，例如 yanque-admin", required = true) String repository,
            @ToolParam(description = "只读命令：rg、sed、nl、head、tail、wc", required = true) String command,
            @ToolParam(description = "命令参数数组，不要传 shell 管道或重定向", required = false) List<String> args) {
        try {
            validate(repository, command, args);
            Path repo = repositoryRoot.resolve(repository).normalize();
            if (!repo.startsWith(repositoryRoot) || !Files.isDirectory(repo)) {
                return failure("仓库不存在或不在源码白名单中");
            }
            List<String> processArgs = new ArrayList<>();
            processArgs.add(command);
            if (args != null) processArgs.addAll(args);
            Process process = new ProcessBuilder(processArgs).directory(repo.toFile()).redirectErrorStream(true).start();
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null && output.length() < MAX_OUTPUT_CHARS) {
                    output.append(line).append('\n');
                }
            }
            boolean completed = process.waitFor(TIMEOUT.toMillis(), TimeUnit.MILLISECONDS);
            if (!completed) {
                process.destroyForcibly();
                return result(false, -1, output, "命令执行超过 5 秒，已终止");
            }
            return result(process.exitValue() == 0, process.exitValue(), output, null);
        } catch (IllegalArgumentException e) {
            return failure(e.getMessage());
        } catch (Exception e) {
            return failure("源码命令执行失败: " + e.getMessage());
        }
    }

    private void validate(String repository, String command, List<String> args) {
        if (repository == null || !SAFE_REPOSITORY.matcher(repository).matches()
                || !ALLOWED_REPOSITORIES.contains(repository)) throw new IllegalArgumentException("只允许读取 yanque-admin 源码仓库");
        if (command == null || !ALLOWED_COMMANDS.contains(command)) throw new IllegalArgumentException("命令不在只读白名单中");
        if (args == null) return;
        for (String arg : args) {
            if (arg == null || arg.contains("\0") || arg.equals("-i") || arg.equals("-f") || arg.equals("--pre")
                    || Path.of(arg).isAbsolute() || arg.equals("..") || arg.startsWith("../") || arg.startsWith("..\\")
                    || arg.contains(".env") || arg.contains("id_rsa") || arg.contains(".pem") || arg.contains(".key")) {
                throw new IllegalArgumentException("命令参数包含禁止内容");
            }
        }
    }

    private Map<String, Object> result(boolean success, int exitCode, StringBuilder output, String error) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", success);
        result.put("exitCode", exitCode);
        result.put("truncated", output.length() >= MAX_OUTPUT_CHARS);
        result.put("output", output.toString());
        if (error != null) result.put("error", error);
        return result;
    }

    private Map<String, Object> failure(String message) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", false);
        result.put("error", message);
        return result;
    }
}
