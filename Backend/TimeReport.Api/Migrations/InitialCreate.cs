using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TimeReport.Api.Migrations;

[Migration("20240101000000_InitialCreate")]
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "users",
            columns: table => new
            {
                id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                email = table.Column<string>(type: "TEXT", nullable: false),
                password_hash = table.Column<string>(type: "TEXT", nullable: true),
                name = table.Column<string>(type: "TEXT", nullable: true),
                avatar_url = table.Column<string>(type: "TEXT", nullable: true),
                is_admin = table.Column<bool>(type: "INTEGER", nullable: false),
                jira_url = table.Column<string>(type: "TEXT", nullable: true),
                jira_email = table.Column<string>(type: "TEXT", nullable: true),
                jira_api_token = table.Column<string>(type: "TEXT", nullable: true),
                jira_integration_system = table.Column<string>(type: "TEXT", nullable: false),
                created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_users", x => x.id);
            });

        migrationBuilder.CreateTable(
            name: "projects",
            columns: table => new
            {
                id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                user_id = table.Column<int>(type: "INTEGER", nullable: false),
                name = table.Column<string>(type: "TEXT", nullable: false),
                description = table.Column<string>(type: "TEXT", nullable: true),
                is_archived = table.Column<bool>(type: "INTEGER", nullable: false),
                created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_projects", x => x.id);
                table.ForeignKey(
                    name: "fk_projects_users_user_id",
                    column: x => x.user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "tasks",
            columns: table => new
            {
                id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                user_id = table.Column<int>(type: "INTEGER", nullable: false),
                project_id = table.Column<int>(type: "INTEGER", nullable: true),
                title = table.Column<string>(type: "TEXT", nullable: false),
                description = table.Column<string>(type: "TEXT", nullable: true),
                is_archived = table.Column<bool>(type: "INTEGER", nullable: false),
                is_favorite = table.Column<bool>(type: "INTEGER", nullable: false),
                jira_url = table.Column<string>(type: "TEXT", nullable: true),
                last_used_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                deleted_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_tasks", x => x.id);
                table.ForeignKey(
                    name: "fk_tasks_projects_project_id",
                    column: x => x.project_id,
                    principalTable: "projects",
                    principalColumn: "id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "fk_tasks_users_user_id",
                    column: x => x.user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "daily_notes",
            columns: table => new
            {
                id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                user_id = table.Column<int>(type: "INTEGER", nullable: false),
                date = table.Column<string>(type: "TEXT", nullable: false),
                content = table.Column<string>(type: "TEXT", nullable: false),
                created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_daily_notes", x => x.id);
                table.ForeignKey(
                    name: "fk_daily_notes_users_user_id",
                    column: x => x.user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "planner_blocks",
            columns: table => new
            {
                id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                user_id = table.Column<int>(type: "INTEGER", nullable: false),
                date = table.Column<string>(type: "TEXT", nullable: false),
                title = table.Column<string>(type: "TEXT", nullable: false),
                start_time = table.Column<DateTime>(type: "TEXT", nullable: true),
                end_time = table.Column<DateTime>(type: "TEXT", nullable: true),
                color = table.Column<string>(type: "TEXT", nullable: true),
                notes = table.Column<string>(type: "TEXT", nullable: true),
                created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_planner_blocks", x => x.id);
                table.ForeignKey(
                    name: "fk_planner_blocks_users_user_id",
                    column: x => x.user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "time_entries",
            columns: table => new
            {
                id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                user_id = table.Column<int>(type: "INTEGER", nullable: false),
                task_id = table.Column<int>(type: "INTEGER", nullable: false),
                date = table.Column<string>(type: "TEXT", nullable: false),
                description = table.Column<string>(type: "TEXT", nullable: true),
                start_time = table.Column<DateTime>(type: "TEXT", nullable: true),
                end_time = table.Column<DateTime>(type: "TEXT", nullable: true),
                duration_minutes = table.Column<int>(type: "INTEGER", nullable: true),
                position = table.Column<int>(type: "INTEGER", nullable: false),
                jira_worklog_id = table.Column<string>(type: "TEXT", nullable: true),
                pushed_to_system = table.Column<string>(type: "TEXT", nullable: true),
                pushed_at = table.Column<DateTime>(type: "TEXT", nullable: true),
                created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_time_entries", x => x.id);
                table.ForeignKey(
                    name: "fk_time_entries_tasks_task_id",
                    column: x => x.task_id,
                    principalTable: "tasks",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "fk_time_entries_users_user_id",
                    column: x => x.user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "users_email_key",
            table: "users",
            column: "email",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "index_projects_on_user_id_and_name",
            table: "projects",
            columns: new[] { "user_id", "name" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "tasks_user_id_idx",
            table: "tasks",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "time_entries_user_id_idx",
            table: "time_entries",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "time_entries_task_id_idx",
            table: "time_entries",
            column: "task_id");

        migrationBuilder.CreateIndex(
            name: "time_entries_user_id_date_position_idx",
            table: "time_entries",
            columns: new[] { "user_id", "date", "position" });

        migrationBuilder.CreateIndex(
            name: "daily_notes_user_id_date_key",
            table: "daily_notes",
            columns: new[] { "user_id", "date" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "planner_blocks_user_id_date_idx",
            table: "planner_blocks",
            columns: new[] { "user_id", "date" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "time_entries");
        migrationBuilder.DropTable(name: "daily_notes");
        migrationBuilder.DropTable(name: "planner_blocks");
        migrationBuilder.DropTable(name: "tasks");
        migrationBuilder.DropTable(name: "projects");
        migrationBuilder.DropTable(name: "users");
    }
}
