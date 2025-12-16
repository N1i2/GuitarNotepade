using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class addedStrummingPattern : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_StrummingPatterns_PatternType",
                table: "StrummingPatterns");

            migrationBuilder.DropColumn(
                name: "DiagramImageUrl",
                table: "StrummingPatterns");

            migrationBuilder.DropColumn(
                name: "PatternType",
                table: "StrummingPatterns");

            migrationBuilder.AlterColumn<string>(
                name: "Pattern",
                table: "StrummingPatterns",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "StrummingPatterns",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "StrummingPatterns",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "StrummingPatterns",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "StrummingPatterns",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsFingerStyle",
                table: "StrummingPatterns",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "StrummingPatterns",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StrummingPatterns_CreatedByUserId",
                table: "StrummingPatterns",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StrummingPatterns_IsFingerStyle",
                table: "StrummingPatterns",
                column: "IsFingerStyle");

            migrationBuilder.CreateIndex(
                name: "IX_StrummingPatterns_Name_CreatedByUserId",
                table: "StrummingPatterns",
                columns: new[] { "Name", "CreatedByUserId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_StrummingPatterns_Users_CreatedByUserId",
                table: "StrummingPatterns",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StrummingPatterns_Users_CreatedByUserId",
                table: "StrummingPatterns");

            migrationBuilder.DropIndex(
                name: "IX_StrummingPatterns_CreatedByUserId",
                table: "StrummingPatterns");

            migrationBuilder.DropIndex(
                name: "IX_StrummingPatterns_IsFingerStyle",
                table: "StrummingPatterns");

            migrationBuilder.DropIndex(
                name: "IX_StrummingPatterns_Name_CreatedByUserId",
                table: "StrummingPatterns");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "StrummingPatterns");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "StrummingPatterns");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "StrummingPatterns");

            migrationBuilder.DropColumn(
                name: "IsFingerStyle",
                table: "StrummingPatterns");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "StrummingPatterns");

            migrationBuilder.AlterColumn<string>(
                name: "Pattern",
                table: "StrummingPatterns",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "StrummingPatterns",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AddColumn<string>(
                name: "DiagramImageUrl",
                table: "StrummingPatterns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PatternType",
                table: "StrummingPatterns",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_StrummingPatterns_PatternType",
                table: "StrummingPatterns",
                column: "PatternType");
        }
    }
}
