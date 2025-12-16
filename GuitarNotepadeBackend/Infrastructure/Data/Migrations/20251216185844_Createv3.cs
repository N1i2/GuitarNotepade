using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Createv3 : Migration
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
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true)
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
                    table.ForeignKey(
                        name: "FK_Chords_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Songs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Lyrics = table.Column<string>(type: "text", nullable: false),
                    Artist = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentsSongId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Songs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Songs_Songs_ParentsSongId",
                        column: x => x.ParentsSongId,
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
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true)
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
                    table.ForeignKey(
                        name: "FK_StrummingPatterns_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SongChords",
                columns: table => new
                {
                    SongId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChordId = table.Column<Guid>(type: "uuid", nullable: false),
                    Id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongChords", x => new { x.SongId, x.ChordId });
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
                name: "SongPatterns",
                columns: table => new
                {
                    SongId = table.Column<Guid>(type: "uuid", nullable: false),
                    StrummingPatternId = table.Column<Guid>(type: "uuid", nullable: false),
                    Id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongPatterns", x => new { x.SongId, x.StrummingPatternId });
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

            migrationBuilder.CreateIndex(
                name: "IX_Chords_CreatedByUserId",
                table: "Chords",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Chords_Name",
                table: "Chords",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Chords_UserId",
                table: "Chords",
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
                name: "IX_SongPatterns_SongId",
                table: "SongPatterns",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_SongPatterns_StrummingPatternId",
                table: "SongPatterns",
                column: "StrummingPatternId");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_IsPublic",
                table: "Songs",
                column: "IsPublic");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_OwnerId",
                table: "Songs",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Songs_ParentsSongId",
                table: "Songs",
                column: "ParentsSongId");

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
                name: "IX_StrummingPatterns_UserId",
                table: "StrummingPatterns",
                column: "UserId");

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
                name: "SongChords");

            migrationBuilder.DropTable(
                name: "SongPatterns");

            migrationBuilder.DropTable(
                name: "Chords");

            migrationBuilder.DropTable(
                name: "Songs");

            migrationBuilder.DropTable(
                name: "StrummingPatterns");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
