# MySQL 初始化说明

`00-create-databases.sql` 只负责创建两个数据库。首次部署前，请按项目 SQL 依赖顺序将 YanQue 和 Bear MCP 的建表脚本放入本目录，或登录 MySQL 手动执行：

- `YanQue-Admin-14/sql/` 下的业务表、AI、知识库和 Text-to-SQL 脚本
- `bear-mcp-single/bear-mcp-single` 中的 MCP 建表脚本

MySQL 官方镜像只会在数据目录为空时执行 `/docker-entrypoint-initdb.d` 中的脚本；已有数据时不会重复执行。
