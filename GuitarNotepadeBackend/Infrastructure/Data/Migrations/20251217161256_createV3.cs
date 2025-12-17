using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class createV3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    NikName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AvatarUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Bio = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    BlockedUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BlockReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreateAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Chords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Fingering = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Chords_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Songs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Artist = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentSongId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FullText = table.Column<string>(type: "text", nullable: false),
                    StructureJson = table.Column<string>(type: "jsonb", nullable: false),
                    CompiledView = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Songs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Songs_Songs_ParentSongId",
                        column: x => x.ParentSongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Songs_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StrummingPatterns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Pattern = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    IsFingerStyle = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StrummingPatterns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StrummingPatterns_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SongChords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SongId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChordId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongChords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SongChords_Chords_ChordId",
                        column: x => x.ChordId,
                        principalTable: "Chords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongChords_Songs_SongId",
                        column: x => x.SongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SongReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SongId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewText = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    BeautifulLevel = table.Column<int>(type: "integer", precision: 3, scale: 2, nullable: true),
                    DifficultyLevel = table.Column<int>(type: "integer", precision: 3, scale: 2, nullable: true),
                    LikesCount = table.Column<int>(type: "integer", nullable: false),
                    DislikesCount = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SongReviews_Songs_SongId",
                        column: x => x.SongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongReviews_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SongPatterns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SongId = table.Column<Guid>(type: "uuid", nullable: false),
                    StrummingPatternId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongPatterns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SongPatterns_Songs_SongId",
                        column: x => x.SongId,
                        principalTable: "Songs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongPatterns_StrummingPatterns_StrummingPatternId",
                        column: x => x.StrummingPatternId,
                        principalTable: "StrummingPatterns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReviewLikes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReviewId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsLike = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReviewLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReviewLikes_SongReviews_ReviewId",
                        column: x => x.ReviewId,
                        principalTable: "SongReviews",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ReviewLikes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Chords_CreatedByUserId",
                table: "Chords",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Chords_Name",
                table: "Chords",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewLikes_ReviewId",
                table: "ReviewLikes",
                column: "ReviewId");

            migrationBuilder.CreateIndex(
                name: "IX_ReviewLikes_ReviewId_UserId",
                table: "ReviewLikes",
                columns: new[] { "ReviewId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReviewLikes_UserId",
                table: "ReviewLikes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SongChords_ChordId",
                table: "SongChords",
                column: "ChordId");

            migrationBuilder.CreateIndex(
                name: "IX_SongChords_SongId",
                table: "SongChords",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_SongChords_SongId_ChordId",
                table: "SongChords",
                columns: new[] { "SongId", "ChordId" });

            migrationBuilder.CreateIndex(
                name: "IX_SongPatterns_SongId",
                table: "SongPatterns",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_SongPatterns_SongId_StrummingPatternId",
                table: "SongPatterns",
                columns: new[] { "SongId", "StrummingPatternId" });

            migrationBuilder.CreateIndex(
                name: "IX_SongPatterns_StrummingPatternId",
                table: "SongPatterns",
                column: "StrummingPatternId");

            migrationBuilder.CreateIndex(
                name: "IX_SongReviews_SongId",
                table: "SongReviews",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_SongReviews_SongId_UserId",
                table: "SongReviews",
                columns: new[] { "SongId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SongReviews_UserId",
                table: "SongReviews",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_FullText",
                table: "Songs",
                column: "FullText");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_IsPublic",
                table: "Songs",
                column: "IsPublic");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_OwnerId",
                table: "Songs",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_ParentSongId",
                table: "Songs",
                column: "ParentSongId");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_Title",
                table: "Songs",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_StrummingPatterns_CreatedByUserId",
                table: "StrummingPatterns",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StrummingPatterns_IsFingerStyle",
                table: "StrummingPatterns",
                column: "IsFingerStyle");

            migrationBuilder.CreateIndex(
                name: "IX_StrummingPatterns_Name",
                table: "StrummingPatterns",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Users_BlockedUntil",
                table: "Users",
                column: "BlockedUntil");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_NikName",
                table: "Users",
                column: "NikName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role",
                table: "Users",
                column: "Role");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReviewLikes");

            migrationBuilder.DropTable(
                name: "SongChords");

            migrationBuilder.DropTable(
                name: "SongPatterns");

            migrationBuilder.DropTable(
                name: "SongReviews");

            migrationBuilder.DropTable(
                name: "Chords");

            migrationBuilder.DropTable(
                name: "StrummingPatterns");

            migrationBuilder.DropTable(
                name: "Songs");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
