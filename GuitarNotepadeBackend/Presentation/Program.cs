using Application;
using DotNetEnv;
using Infrastructure;
using Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Presentation.Filters;
using System.Text;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true")
{
    Console.WriteLine("Running in Docker container, loading .env.docker...");
    Env.Load(".env.docker");
}
else
{
    Console.WriteLine("Running locally, loading .env...");
    Env.Load();
}

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
                ?? throw new ArgumentNullException("JWT_SECRET is not set in .env");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "GuitarNotepad";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "GuitarNotepadUsers";

builder.Services.AddControllers(options =>
{
    options.Filters.Add<CustomExceptionFilter>();
});

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();
builder.Services.AddHttpContextAccessor();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("User", policy =>
        policy.RequireAuthenticatedUser());

    options.AddPolicy("Admin", policy =>
        policy.RequireAuthenticatedUser()
              .RequireRole("Admin"));
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GuitarNotepad API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// 🔥 ИСПРАВЛЕНИЕ: Правильные CORS настройки
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5000"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var dbContext = services.GetRequiredService<AppDbContext>();

        var pendingMigrations = dbContext.Database.GetPendingMigrations();
        if (pendingMigrations.Any())
        {
            Console.WriteLine($"Applying {pendingMigrations.Count()} pending migrations...");
            foreach (var migration in pendingMigrations)
            {
                Console.WriteLine($"  - {migration}");
            }

            dbContext.Database.Migrate();
            Console.WriteLine("Migrations applied successfully!");
        }
        else
        {
            Console.WriteLine("No pending migrations found. Database is up to date.");
        }

        var canConnect = dbContext.Database.CanConnect();
        Console.WriteLine($"Database connection test: {(canConnect ? "SUCCESS" : "FAILED")}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"ERROR applying migrations: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
        if (!app.Environment.IsDevelopment())
            throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", async context =>
{
    context.Response.Redirect("/swagger/index.html");
    await Task.CompletedTask;
});

app.MapGet("/health", () => "Healthy");

app.MapGet("/health/db", async (AppDbContext dbContext) =>
{
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        return Results.Ok(new
        {
            Status = "Healthy",
            Database = canConnect ? "Connected" : "Disconnected",
            Timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            title: "Database Unhealthy",
            detail: ex.Message,
            statusCode: StatusCodes.Status503ServiceUnavailable
        );
    }
});

app.MapGet("/health/full", async (AppDbContext dbContext) =>
{
    var result = new
    {
        Status = "Healthy",
        Timestamp = DateTime.UtcNow,
        Services = new Dictionary<string, string>()
    };

    try
    {
        var dbConnected = await dbContext.Database.CanConnectAsync();
        result.Services["database"] = dbConnected ? "Connected" : "Disconnected";

        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(
            title: "Service Unhealthy",
            detail: ex.Message,
            statusCode: StatusCodes.Status503ServiceUnavailable
        );
    }
});

app.Run();