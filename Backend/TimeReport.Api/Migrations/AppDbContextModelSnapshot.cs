using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using TimeReport.Api.Data;

#nullable disable

namespace TimeReport.Api.Migrations;

[DbContext(typeof(AppDbContext))]
partial class AppDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder.HasAnnotation("ProductVersion", "10.0.8");

        modelBuilder.Entity("TimeReport.Api.Data.Entities.DailyNote", b =>
        {
            b.Property<int>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("INTEGER")
                .HasColumnName("id");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("created_at");

            b.Property<string>("Content")
                .IsRequired()
                .HasColumnType("TEXT")
                .HasColumnName("content");

            b.Property<string>("Date")
                .IsRequired()
                .HasColumnType("TEXT")
                .HasColumnName("date");

            b.Property<DateTime>("UpdatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("updated_at");

            b.Property<int>("UserId")
                .HasColumnType("INTEGER")
                .HasColumnName("user_id");

            b.HasKey("Id")
                .HasName("pk_daily_notes");

            b.HasIndex(new[] { "UserId", "Date" }, "daily_notes_user_id_date_key")
                .IsUnique();

            b.ToTable("daily_notes");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.PlannerBlock", b =>
        {
            b.Property<int>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("INTEGER")
                .HasColumnName("id");

            b.Property<string>("Color")
                .HasColumnType("TEXT")
                .HasColumnName("color");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("created_at");

            b.Property<string>("Date")
                .IsRequired()
                .HasColumnType("TEXT")
                .HasColumnName("date");

            b.Property<DateTime?>("EndTime")
                .HasColumnType("TEXT")
                .HasColumnName("end_time");

            b.Property<string>("Notes")
                .HasColumnType("TEXT")
                .HasColumnName("notes");

            b.Property<DateTime?>("StartTime")
                .HasColumnType("TEXT")
                .HasColumnName("start_time");

            b.Property<string>("Title")
                .IsRequired()
                .HasColumnType("TEXT")
                .HasColumnName("title");

            b.Property<DateTime>("UpdatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("updated_at");

            b.Property<int>("UserId")
                .HasColumnType("INTEGER")
                .HasColumnName("user_id");

            b.HasKey("Id")
                .HasName("pk_planner_blocks");

            b.HasIndex(new[] { "UserId", "Date" }, "planner_blocks_user_id_date_idx");

            b.ToTable("planner_blocks");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.Project", b =>
        {
            b.Property<int>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("INTEGER")
                .HasColumnName("id");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("created_at");

            b.Property<string>("Description")
                .HasColumnType("TEXT")
                .HasColumnName("description");

            b.Property<bool>("IsArchived")
                .HasColumnType("INTEGER")
                .HasColumnName("is_archived");

            b.Property<string>("Name")
                .IsRequired()
                .HasColumnType("TEXT")
                .HasColumnName("name");

            b.Property<DateTime>("UpdatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("updated_at");

            b.Property<int>("UserId")
                .HasColumnType("INTEGER")
                .HasColumnName("user_id");

            b.HasKey("Id")
                .HasName("pk_projects");

            b.HasIndex(new[] { "UserId", "Name" }, "index_projects_on_user_id_and_name")
                .IsUnique();

            b.ToTable("projects");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.AppTask", b =>
        {
            b.Property<int>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("INTEGER")
                .HasColumnName("id");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("created_at");

            b.Property<DateTime?>("DeletedAt")
                .HasColumnType("TEXT")
                .HasColumnName("deleted_at");

            b.Property<string>("Description")
                .HasColumnType("TEXT")
                .HasColumnName("description");

            b.Property<bool>("IsArchived")
                .HasColumnType("INTEGER")
                .HasColumnName("is_archived");

            b.Property<bool>("IsFavorite")
                .HasColumnType("INTEGER")
                .HasColumnName("is_favorite");

            b.Property<string>("JiraUrl")
                .HasColumnType("TEXT")
                .HasColumnName("jira_url");

            b.Property<DateTime?>("LastUsedAt")
                .HasColumnType("TEXT")
                .HasColumnName("last_used_at");

            b.Property<int?>("ProjectId")
                .HasColumnType("INTEGER")
                .HasColumnName("project_id");

            b.Property<string>("Title")
                .IsRequired()
                .HasColumnType("TEXT")
                .HasColumnName("title");

            b.Property<DateTime>("UpdatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("updated_at");

            b.Property<int>("UserId")
                .HasColumnType("INTEGER")
                .HasColumnName("user_id");

            b.HasKey("Id")
                .HasName("pk_tasks");

            b.HasIndex("UserId", "tasks_user_id_idx");

            b.ToTable("tasks");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.TimeEntry", b =>
        {
            b.Property<int>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("INTEGER")
                .HasColumnName("id");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("created_at");

            b.Property<string>("Date")
                .IsRequired()
                .HasColumnType("TEXT")
                .HasColumnName("date");

            b.Property<string>("Description")
                .HasColumnType("TEXT")
                .HasColumnName("description");

            b.Property<int?>("DurationMinutes")
                .HasColumnType("INTEGER")
                .HasColumnName("duration_minutes");

            b.Property<DateTime?>("EndTime")
                .HasColumnType("TEXT")
                .HasColumnName("end_time");

            b.Property<string>("JiraWorklogId")
                .HasColumnType("TEXT")
                .HasColumnName("jira_worklog_id");

            b.Property<int>("Position")
                .HasColumnType("INTEGER")
                .HasColumnName("position");

            b.Property<DateTime?>("PushedAt")
                .HasColumnType("TEXT")
                .HasColumnName("pushed_at");

            b.Property<string>("PushedToSystem")
                .HasColumnType("TEXT")
                .HasColumnName("pushed_to_system");

            b.Property<DateTime?>("StartTime")
                .HasColumnType("TEXT")
                .HasColumnName("start_time");

            b.Property<int>("TaskId")
                .HasColumnType("INTEGER")
                .HasColumnName("task_id");

            b.Property<DateTime>("UpdatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("updated_at");

            b.Property<int>("UserId")
                .HasColumnType("INTEGER")
                .HasColumnName("user_id");

            b.HasKey("Id")
                .HasName("pk_time_entries");

            b.HasIndex("UserId", "time_entries_user_id_idx");
            b.HasIndex("TaskId", "time_entries_task_id_idx");
            b.HasIndex(new[] { "UserId", "Date", "Position" }, "time_entries_user_id_date_position_idx");

            b.ToTable("time_entries");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.User", b =>
        {
            b.Property<int>("Id")
                .ValueGeneratedOnAdd()
                .HasColumnType("INTEGER")
                .HasColumnName("id");

            b.Property<string>("AvatarUrl")
                .HasColumnType("TEXT")
                .HasColumnName("avatar_url");

            b.Property<DateTime>("CreatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("created_at");

            b.Property<string>("Email")
                .IsRequired()
                .HasColumnType("TEXT")
                .HasColumnName("email");

            b.Property<bool>("IsAdmin")
                .HasColumnType("INTEGER")
                .HasColumnName("is_admin");

            b.Property<string>("JiraApiToken")
                .HasColumnType("TEXT")
                .HasColumnName("jira_api_token");

            b.Property<string>("JiraEmail")
                .HasColumnType("TEXT")
                .HasColumnName("jira_email");

            b.Property<string>("JiraIntegrationSystem")
                .IsRequired()
                .HasColumnType("TEXT")
                .HasColumnName("jira_integration_system");

            b.Property<string>("JiraUrl")
                .HasColumnType("TEXT")
                .HasColumnName("jira_url");

            b.Property<string>("Name")
                .HasColumnType("TEXT")
                .HasColumnName("name");

            b.Property<string>("PasswordHash")
                .HasColumnType("TEXT")
                .HasColumnName("password_hash");

            b.Property<DateTime>("UpdatedAt")
                .HasColumnType("TEXT")
                .HasColumnName("updated_at");

            b.HasKey("Id")
                .HasName("pk_users");

            b.HasIndex("Email", "users_email_key")
                .IsUnique();

            b.ToTable("users");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.DailyNote", b =>
        {
            b.HasOne("TimeReport.Api.Data.Entities.User", "User")
                .WithMany("DailyNotes")
                .HasForeignKey("UserId")
                .HasConstraintName("fk_daily_notes_users_user_id")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("User");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.PlannerBlock", b =>
        {
            b.HasOne("TimeReport.Api.Data.Entities.User", "User")
                .WithMany("PlannerBlocks")
                .HasForeignKey("UserId")
                .HasConstraintName("fk_planner_blocks_users_user_id")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("User");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.Project", b =>
        {
            b.HasOne("TimeReport.Api.Data.Entities.User", "User")
                .WithMany("Projects")
                .HasForeignKey("UserId")
                .HasConstraintName("fk_projects_users_user_id")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("User");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.AppTask", b =>
        {
            b.HasOne("TimeReport.Api.Data.Entities.Project", "Project")
                .WithMany("Tasks")
                .HasForeignKey("ProjectId")
                .HasConstraintName("fk_tasks_projects_project_id")
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne("TimeReport.Api.Data.Entities.User", "User")
                .WithMany("Tasks")
                .HasForeignKey("UserId")
                .HasConstraintName("fk_tasks_users_user_id")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Project");
            b.Navigation("User");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.TimeEntry", b =>
        {
            b.HasOne("TimeReport.Api.Data.Entities.AppTask", "Task")
                .WithMany("TimeEntries")
                .HasForeignKey("TaskId")
                .HasConstraintName("fk_time_entries_tasks_task_id")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.HasOne("TimeReport.Api.Data.Entities.User", "User")
                .WithMany("TimeEntries")
                .HasForeignKey("UserId")
                .HasConstraintName("fk_time_entries_users_user_id")
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            b.Navigation("Task");
            b.Navigation("User");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.User", b =>
        {
            b.Navigation("DailyNotes");
            b.Navigation("PlannerBlocks");
            b.Navigation("Projects");
            b.Navigation("Tasks");
            b.Navigation("TimeEntries");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.Project", b =>
        {
            b.Navigation("Tasks");
        });

        modelBuilder.Entity("TimeReport.Api.Data.Entities.AppTask", b =>
        {
            b.Navigation("TimeEntries");
        });
#pragma warning restore 612, 618
    }
}
