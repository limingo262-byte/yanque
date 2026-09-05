"""同步 Bear MCP 的 Text-to-SQL 角色权限和 demo token 选择。"""

import os

import pymysql


def main() -> None:
    connection = pymysql.connect(
        host=os.getenv("BEAR_DB_HOST", "127.0.0.1"),
        port=int(os.getenv("BEAR_DB_PORT", "3306")),
        user=os.getenv("BEAR_DB_USER", "root"),
        password=os.getenv("BEAR_DB_PASSWORD", "root"),
        database=os.getenv("BEAR_DB_NAME", "bear-mcp-single"),
        charset="utf8mb4",
        autocommit=False,
    )
    tools = [
        "list_mcp_resources",
        "read_mcp_resource",
        "list_data_sources",
        "query_data_source",
        "render_prompt",
        "get_skill",
        "create_resource",
        "create_skill",
    ]
    try:
        with connection.cursor() as cursor:
            for tool_name in tools:
                cursor.execute(
                    "INSERT IGNORE INTO mcp_role_tool (role_code, tool_name) VALUES ('ADMIN', %s)",
                    (tool_name,),
                )

            # 这两张选择表历史上没有唯一约束，先只清理 demo token 的目标能力，
            # 再按当前已发布资源重建，避免重复记录让过滤结果不稳定。
            placeholders = ",".join(["%s"] * len(tools))
            cursor.execute(
                f"DELETE FROM mcp_user_tool_selection WHERE token_id=1 AND tool_name IN ({placeholders})",
                tools,
            )
            for tool_name in tools:
                cursor.execute(
                    "INSERT INTO mcp_user_tool_selection (token_id, tool_name, tool_type, is_enabled) "
                    "VALUES (1, %s, 'BUILTIN', 1)",
                    (tool_name,),
                )

            cursor.execute(
                "INSERT IGNORE INTO mcp_role_prompt (role_code, prompt_name) "
                "VALUES ('ADMIN', 'yanque_text_to_sql')"
            )
            cursor.execute(
                "DELETE FROM mcp_user_prompt_selection WHERE token_id=1 AND prompt_name='yanque_text_to_sql'"
            )
            cursor.execute(
                "INSERT INTO mcp_user_prompt_selection (token_id, prompt_name, is_enabled) "
                "VALUES (1, 'yanque_text_to_sql', 1)"
            )

            cursor.execute(
                "INSERT IGNORE INTO mcp_role_resource (role_code, resource_uri) "
                "SELECT 'ADMIN', resource_uri FROM mcp_resource "
                "WHERE is_enabled=1 AND publish_status IN (1,2) "
                "AND resource_uri LIKE 'bear://yanque/text-to-sql/%'"
            )
            cursor.execute(
                "DELETE FROM mcp_user_resource_selection "
                "WHERE token_id=1 AND resource_uri LIKE 'bear://yanque/text-to-sql/%'"
            )
            cursor.execute(
                "INSERT INTO mcp_user_resource_selection (token_id, resource_uri, is_enabled) "
                "SELECT 1, resource_uri, 1 FROM mcp_role_resource "
                "WHERE role_code='ADMIN' AND resource_uri LIKE 'bear://yanque/text-to-sql/%'"
            )
        connection.commit()
        print("permissions repaired")
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


if __name__ == "__main__":
    main()
