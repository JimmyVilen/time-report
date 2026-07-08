using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TimeReport.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_daily_notes_users_user_id",
                table: "daily_notes");

            migrationBuilder.DropForeignKey(
                name: "fk_planner_blocks_users_user_id",
                table: "planner_blocks");

            migrationBuilder.DropForeignKey(
                name: "fk_projects_users_user_id",
                table: "projects");

            migrationBuilder.DropForeignKey(
                name: "fk_tasks_projects_project_id",
                table: "tasks");

            migrationBuilder.DropForeignKey(
                name: "fk_tasks_users_user_id",
                table: "tasks");

            migrationBuilder.DropForeignKey(
                name: "fk_time_entries_tasks_task_id",
                table: "time_entries");

            migrationBuilder.DropForeignKey(
                name: "fk_time_entries_users_user_id",
                table: "time_entries");

            migrationBuilder.DropPrimaryKey(
                name: "pk_users",
                table: "users");

            migrationBuilder.DropPrimaryKey(
                name: "pk_time_entries",
                table: "time_entries");

            migrationBuilder.DropPrimaryKey(
                name: "pk_tasks",
                table: "tasks");

            migrationBuilder.DropPrimaryKey(
                name: "pk_projects",
                table: "projects");

            migrationBuilder.DropPrimaryKey(
                name: "pk_planner_blocks",
                table: "planner_blocks");

            migrationBuilder.DropPrimaryKey(
                name: "pk_daily_notes",
                table: "daily_notes");

            migrationBuilder.AddPrimaryKey(
                name: "PK_users",
                table: "users",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_time_entries",
                table: "time_entries",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_tasks",
                table: "tasks",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_projects",
                table: "projects",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_planner_blocks",
                table: "planner_blocks",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_daily_notes",
                table: "daily_notes",
                column: "id");

            migrationBuilder.CreateTable(
                name: "tags",
                columns: table => new
                {
                    id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    user_id = table.Column<int>(type: "INTEGER", nullable: false),
                    name = table.Column<string>(type: "TEXT", nullable: false),
                    color = table.Column<string>(type: "TEXT", nullable: true),
                    created_at = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tags", x => x.id);
                    table.ForeignKey(
                        name: "FK_tags_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "time_entry_tags",
                columns: table => new
                {
                    time_entry_id = table.Column<int>(type: "INTEGER", nullable: false),
                    tag_id = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_time_entry_tags", x => new { x.time_entry_id, x.tag_id });
                    table.ForeignKey(
                        name: "FK_time_entry_tags_tags_tag_id",
                        column: x => x.tag_id,
                        principalTable: "tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_time_entry_tags_time_entries_time_entry_id",
                        column: x => x.time_entry_id,
                        principalTable: "time_entries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tasks_project_id",
                table: "tasks",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "tags_user_id_name_key",
                table: "tags",
                columns: new[] { "user_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_time_entry_tags_tag_id",
                table: "time_entry_tags",
                column: "tag_id");

            migrationBuilder.AddForeignKey(
                name: "FK_daily_notes_users_user_id",
                table: "daily_notes",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_planner_blocks_users_user_id",
                table: "planner_blocks",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_projects_users_user_id",
                table: "projects",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_tasks_projects_project_id",
                table: "tasks",
                column: "project_id",
                principalTable: "projects",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_tasks_users_user_id",
                table: "tasks",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_time_entries_tasks_task_id",
                table: "time_entries",
                column: "task_id",
                principalTable: "tasks",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_time_entries_users_user_id",
                table: "time_entries",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_daily_notes_users_user_id",
                table: "daily_notes");

            migrationBuilder.DropForeignKey(
                name: "FK_planner_blocks_users_user_id",
                table: "planner_blocks");

            migrationBuilder.DropForeignKey(
                name: "FK_projects_users_user_id",
                table: "projects");

            migrationBuilder.DropForeignKey(
                name: "FK_tasks_projects_project_id",
                table: "tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_tasks_users_user_id",
                table: "tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_time_entries_tasks_task_id",
                table: "time_entries");

            migrationBuilder.DropForeignKey(
                name: "FK_time_entries_users_user_id",
                table: "time_entries");

            migrationBuilder.DropTable(
                name: "time_entry_tags");

            migrationBuilder.DropTable(
                name: "tags");

            migrationBuilder.DropPrimaryKey(
                name: "PK_users",
                table: "users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_time_entries",
                table: "time_entries");

            migrationBuilder.DropPrimaryKey(
                name: "PK_tasks",
                table: "tasks");

            migrationBuilder.DropIndex(
                name: "IX_tasks_project_id",
                table: "tasks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_projects",
                table: "projects");

            migrationBuilder.DropPrimaryKey(
                name: "PK_planner_blocks",
                table: "planner_blocks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_daily_notes",
                table: "daily_notes");

            migrationBuilder.AddPrimaryKey(
                name: "pk_users",
                table: "users",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_time_entries",
                table: "time_entries",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_tasks",
                table: "tasks",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_projects",
                table: "projects",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_planner_blocks",
                table: "planner_blocks",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_daily_notes",
                table: "daily_notes",
                column: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_daily_notes_users_user_id",
                table: "daily_notes",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_planner_blocks_users_user_id",
                table: "planner_blocks",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_projects_users_user_id",
                table: "projects",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_tasks_projects_project_id",
                table: "tasks",
                column: "project_id",
                principalTable: "projects",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "fk_tasks_users_user_id",
                table: "tasks",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_time_entries_tasks_task_id",
                table: "time_entries",
                column: "task_id",
                principalTable: "tasks",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_time_entries_users_user_id",
                table: "time_entries",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
