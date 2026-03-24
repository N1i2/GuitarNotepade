using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class init2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_Albums_TargetId",
                table: "Subscriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_Users_TargetId",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_TargetId",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_UserId_TargetId_IsUserSub",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "TargetId",
                table: "Subscriptions");

            migrationBuilder.AddColumn<Guid>(
                name: "TargetAlbumId",
                table: "Subscriptions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TargetUserId",
                table: "Subscriptions",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_TargetAlbumId",
                table: "Subscriptions",
                column: "TargetAlbumId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_TargetUserId",
                table: "Subscriptions",
                column: "TargetUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_UserId_TargetAlbumId_IsUserSub",
                table: "Subscriptions",
                columns: new[] { "UserId", "TargetAlbumId", "IsUserSub" },
                unique: true,
                filter: "\"TargetAlbumId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_UserId_TargetUserId_IsUserSub",
                table: "Subscriptions",
                columns: new[] { "UserId", "TargetUserId", "IsUserSub" },
                unique: true,
                filter: "\"TargetUserId\" IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Subscription_Target",
                table: "Subscriptions",
                sql: "(\"IsUserSub\" = true AND \"TargetUserId\" IS NOT NULL AND \"TargetAlbumId\" IS NULL) OR (\"IsUserSub\" = false AND \"TargetUserId\" IS NULL AND \"TargetAlbumId\" IS NOT NULL)");

            migrationBuilder.AddForeignKey(
                name: "FK_Subscriptions_Albums_TargetAlbumId",
                table: "Subscriptions",
                column: "TargetAlbumId",
                principalTable: "Albums",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Subscriptions_Users_TargetUserId",
                table: "Subscriptions",
                column: "TargetUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_Albums_TargetAlbumId",
                table: "Subscriptions");

            migrationBuilder.DropForeignKey(
                name: "FK_Subscriptions_Users_TargetUserId",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_TargetAlbumId",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_TargetUserId",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_UserId_TargetAlbumId_IsUserSub",
                table: "Subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Subscriptions_UserId_TargetUserId_IsUserSub",
                table: "Subscriptions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Subscription_Target",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "TargetAlbumId",
                table: "Subscriptions");

            migrationBuilder.DropColumn(
                name: "TargetUserId",
                table: "Subscriptions");

            migrationBuilder.AddColumn<Guid>(
                name: "TargetId",
                table: "Subscriptions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_TargetId",
                table: "Subscriptions",
                column: "TargetId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_UserId_TargetId_IsUserSub",
                table: "Subscriptions",
                columns: new[] { "UserId", "TargetId", "IsUserSub" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Subscriptions_Albums_TargetId",
                table: "Subscriptions",
                column: "TargetId",
                principalTable: "Albums",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Subscriptions_Users_TargetId",
                table: "Subscriptions",
                column: "TargetId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
