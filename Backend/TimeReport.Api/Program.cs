using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Serilog;
using TimeReport.Api.Data;
using TimeReport.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] [{TraceId}] {Message:lj}{NewLine}{Exception}"));

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("Default"))
       .AddInterceptors(new SqlitePragmaInterceptor()));

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = 401;
            return System.Threading.Tasks.Task.CompletedTask;
        };
        o.Events.OnRedirectToAccessDenied = ctx =>
        {
            ctx.Response.StatusCode = 403;
            return System.Threading.Tasks.Task.CompletedTask;
        };
        o.Cookie.HttpOnly = true;
        o.Cookie.SameSite = SameSiteMode.Lax;
        o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        o.Cookie.Name = "timereport_session";
        o.ExpireTimeSpan = TimeSpan.FromDays(30);
        o.SlidingExpiration = true;
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddScoped<JiraService>();
builder.Services.AddScoped<DatabaseSnapshotService>();
builder.Services.AddSingleton<DurationParser>();
builder.Services.AddSingleton<TimeEntryResolverService>();
builder.Services.AddHostedService<DatabaseBackupService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<TimeReport.Api.Data.AppDbContext>();
    db.Database.Migrate();
}

app.UseSerilogRequestLogging();
app.UseDefaultFiles();

var staticFileOptions = new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Vite hashes /assets/* filenames per build, so they can be cached forever.
        // index.html (default document or SPA fallback) must always revalidate so
        // navigations - e.g. the redirect to /login on 401 - pick up new bundle refs.
        var cacheControl = ctx.Context.Request.Path.StartsWithSegments("/assets")
            ? "public, max-age=31536000, immutable"
            : "no-cache";
        ctx.Context.Response.Headers.CacheControl = cacheControl;
    }
};

app.UseStaticFiles(staticFileOptions);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("index.html", staticFileOptions);

app.Run();
