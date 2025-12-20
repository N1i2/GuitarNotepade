using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using System.Reflection;

namespace Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Song> Songs { get; set; }
        public DbSet<Chord> Chords { get; set; }
        public DbSet<StrummingPattern> StrummingPatterns { get; set; }
        public DbSet<SongReview> SongReviews { get; set; }
        public DbSet<ReviewLike> ReviewLikes { get; set; }
        public DbSet<SongSegment> SongSegments { get; set; }
        public DbSet<SongSegmentPosition> SongSegmentPositions { get; set; }
        public DbSet<SongStructure> SongStructures { get; set; }
        public DbSet<SongPattern> SongPatterns { get; set; }
        public DbSet<SongLabel> SongLabels { get; set; }
        public DbSet<SegmentLabel> SegmentLabels { get; set; }
        public DbSet<SongComment> SongComments { get; set; }
        public DbSet<SongChord> SongChords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(256);

                entity.Property(e => e.NikName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.PasswordHash)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.Role)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.AvatarUrl)
                    .HasMaxLength(1000);

                entity.Property(e => e.Bio)
                    .HasMaxLength(1000);

                entity.Property(e => e.BlockReason)
                    .HasMaxLength(500);

                entity.Property(e => e.CreateAt)
                    .IsRequired();

                entity.HasMany(e => e.Songs)
                    .WithOne(e => e.Owner)
                    .HasForeignKey(e => e.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Chords)
                    .WithOne(e => e.CreatedBy)
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.StrummingPatterns)
                    .WithOne(e => e.CreatedBy)
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Reviews)
                    .WithOne(e => e.User)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.ReviewLikes)
                    .WithOne(e => e.User)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Song>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Title)
                    .IsRequired()
                    .HasMaxLength(200);

                entity.Property(e => e.Artist)
                    .HasMaxLength(200);

                entity.Property(e => e.Description)
                    .HasMaxLength(2000);

                entity.Property(e => e.Genre)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Theme)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.FullText)
                    .IsRequired();

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.HasOne(e => e.ParentSong)
                    .WithMany(e => e.ChildSongs)
                    .HasForeignKey(e => e.ParentSongId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Structure)
                    .WithOne(e => e.Song)
                    .HasForeignKey<SongStructure>(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Comments)
                    .WithOne(e => e.Song)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Reviews)
                    .WithOne(e => e.Song)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.SongChords)
                    .WithOne(e => e.Song)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.SongPatterns)
                    .WithOne(e => e.Song)
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Chord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Fingering)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.HasMany(e => e.SongChords)
                    .WithOne(e => e.Chord)
                    .HasForeignKey(e => e.ChordId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StrummingPattern>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(e => e.Pattern)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.Description)
                    .HasMaxLength(1000);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.HasMany(e => e.SongPatterns)
                    .WithOne(e => e.StrummingPattern)
                    .HasForeignKey(e => e.StrummingPatternId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SongStructure>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasMany(e => e.SegmentPositions)
                    .WithOne(e => e.SongStructure)
                    .HasForeignKey(e => e.SongId)
                    .HasPrincipalKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SongSegment>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Lyric)
                    .HasMaxLength(1000);

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.Color)
                    .HasMaxLength(50);

                entity.Property(e => e.BackgroundColor)
                    .HasMaxLength(50);

                entity.Property(e => e.ContentHash)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.HasOne(e => e.Chord)
                    .WithMany()
                    .HasForeignKey(e => e.ChordId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Pattern)
                    .WithMany()
                    .HasForeignKey(e => e.PatternId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(e => e.Positions)
                    .WithOne(e => e.Segment)
                    .HasForeignKey(e => e.SegmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.SegmentLabels)
                    .WithOne(e => e.Segment)
                    .HasForeignKey(e => e.SegmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Comments)
                    .WithOne(e => e.Segment)
                    .HasForeignKey(e => e.SegmentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SongSegmentPosition>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.RepeatGroup)
                    .HasMaxLength(100);

                entity.HasIndex(e => e.PositionIndex);

                entity.HasIndex(e => new { e.SongId, e.PositionIndex })
                    .IsUnique();

                entity.HasOne(e => e.Song)
                    .WithMany()
                    .HasForeignKey(e => e.SongId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<SongReview>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.ReviewText)
                    .IsRequired()
                    .HasMaxLength(2000);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.HasMany(e => e.Likes)
                    .WithOne(e => e.Review)
                    .HasForeignKey(e => e.ReviewId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ReviewLike>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.HasIndex(e => new { e.ReviewId, e.UserId })
                    .IsUnique();
            });

            modelBuilder.Entity<SongPattern>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasIndex(e => new { e.SongId, e.StrummingPatternId })
                    .IsUnique();
            });

            modelBuilder.Entity<SongChord>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasIndex(e => new { e.SongId, e.ChordId })
                    .IsUnique();
            });

            modelBuilder.Entity<SongLabel>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Color)
                    .HasMaxLength(50);
            });

            modelBuilder.Entity<SegmentLabel>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasIndex(e => new { e.SegmentId, e.LabelId })
                    .IsUnique();
            });

            modelBuilder.Entity<SongComment>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Text)
                    .IsRequired()
                    .HasMaxLength(1000);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();
            });

            modelBuilder.Entity<SongSegment>()
                .Property(e => e.Type)
                .HasConversion<string>()
                .HasMaxLength(20);
        }
    }
}