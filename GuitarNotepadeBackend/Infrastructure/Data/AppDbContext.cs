using Domain.Entities;
using Domain.Entities.Base;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Chord> Chords => Set<Chord>();
    public DbSet<StrummingPattern> StrummingPatterns => Set<StrummingPattern>();
    public DbSet<Song> Songs => Set<Song>();
    public DbSet<SongStructure> SongStructures => Set<SongStructure>();
    public DbSet<SongSegment> SongSegments => Set<SongSegment>();
    public DbSet<SongSegmentPosition> SongSegmentPositions => Set<SongSegmentPosition>();
    public DbSet<SongLabel> SongLabels => Set<SongLabel>();
    public DbSet<SegmentLabel> SegmentLabels => Set<SegmentLabel>();
    public DbSet<SongComment> SongComments => Set<SongComment>();
    public DbSet<SongChord> SongChords => Set<SongChord>();
    public DbSet<SongPattern> SongPatterns => Set<SongPattern>();
    public DbSet<SongReview> SongReviews => Set<SongReview>();
    public DbSet<ReviewLike> ReviewLikes => Set<ReviewLike>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.NikName).IsUnique();
            entity.HasIndex(u => u.Role);
            entity.HasIndex(u => u.BlockedUntil);

            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);

            entity.Property(u => u.NikName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(u => u.PasswordHash)
                .IsRequired()
                .HasMaxLength(255);

            entity.Property(u => u.Role)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(u => u.AvatarUrl)
                .HasMaxLength(500);

            entity.Property(u => u.Bio)
                .HasMaxLength(1000);

            entity.Property(u => u.BlockReason)
                .HasMaxLength(500);

            entity.Property(u => u.CreateAt)
                .IsRequired();

            entity.HasMany(u => u.Songs)
                .WithOne(s => s.Owner)
                .HasForeignKey(s => s.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(u => u.Chords)
                .WithOne(c => c.CreatedBy)
                .HasForeignKey(c => c.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(u => u.StrummingPatterns)
                .WithOne(sp => sp.CreatedBy)
                .HasForeignKey(sp => sp.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(u => u.Reviews)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(u => u.ReviewLikes)
                .WithOne(rl => rl.User)
                .HasForeignKey(rl => rl.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Chord>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.HasIndex(c => c.Name);
            entity.HasIndex(c => c.CreatedByUserId);

            entity.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(c => c.Fingering)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(c => c.Description)
                .HasMaxLength(1000);

            entity.Property(c => c.CreatedAt)
                .IsRequired();

            entity.HasOne(c => c.CreatedBy)
                .WithMany(u => u.Chords)
                .HasForeignKey(c => c.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(c => c.SongChords)
                .WithOne(sc => sc.Chord)
                .HasForeignKey(sc => sc.ChordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StrummingPattern>(entity =>
        {
            entity.HasKey(sp => sp.Id);

            entity.HasIndex(sp => sp.Name);
            entity.HasIndex(sp => sp.CreatedByUserId);
            entity.HasIndex(sp => sp.IsFingerStyle);

            entity.Property(sp => sp.Name)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(sp => sp.Pattern)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(sp => sp.Description)
                .HasMaxLength(1000);

            entity.Property(sp => sp.CreatedAt)
                .IsRequired();

            entity.HasOne(sp => sp.CreatedBy)
                .WithMany(u => u.StrummingPatterns)
                .HasForeignKey(sp => sp.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(sp => sp.SongPatterns)
                .WithOne(sp => sp.StrummingPattern)
                .HasForeignKey(sp => sp.StrummingPatternId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Song>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.HasIndex(s => s.Title);
            entity.HasIndex(s => s.OwnerId);
            entity.HasIndex(s => s.IsPublic);
            entity.HasIndex(s => s.ParentSongId);
            entity.HasIndex(s => s.FullText);
            entity.HasIndex(s => s.CreatedAt);
            entity.HasIndex(s => s.UpdatedAt);

            entity.Property(s => s.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(s => s.Artist)
                .HasMaxLength(200);

            entity.Property(s => s.Description)
                .HasMaxLength(2000);

            entity.Property(s => s.Key)
                .HasMaxLength(10);

            entity.Property(s => s.Difficulty)
                .HasMaxLength(50);

            entity.Property(s => s.FullText)
                .IsRequired()
                .HasColumnType("text");

            entity.Property(s => s.CreatedAt)
                .IsRequired();

            entity.Property(s => s.AverageBeautifulRating)
                .HasPrecision(4, 2);

            entity.Property(s => s.AverageDifficultyRating)
                .HasPrecision(4, 2);

            entity.HasOne(s => s.Owner)
                .WithMany(u => u.Songs)
                .HasForeignKey(s => s.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.ParentSong)
                .WithMany(s => s.ChildSongs)
                .HasForeignKey(s => s.ParentSongId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Structure)
                .WithOne(ss => ss.Song)
                .HasForeignKey<SongStructure>(ss => ss.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.Reviews)
                .WithOne(r => r.Song)
                .HasForeignKey(r => r.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.Comments)
                .WithOne(c => c.Song)
                .HasForeignKey(c => c.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.SongChords)
                .WithOne(sc => sc.Song)
                .HasForeignKey(sc => sc.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.SongPatterns)
                .WithOne(sp => sp.Song)
                .HasForeignKey(sp => sp.SongId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongStructure>(entity =>
        {
            entity.HasKey(ss => ss.Id);

            entity.HasIndex(ss => ss.SongId).IsUnique();

            entity.HasOne(ss => ss.Song)
                .WithOne(s => s.Structure)
                .HasForeignKey<SongStructure>(ss => ss.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(ss => ss.SegmentPositions)
                .WithOne()
                .HasForeignKey(sp => sp.SongId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongSegment>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.HasIndex(s => s.Type);
            entity.HasIndex(s => s.ContentHash);
            entity.HasIndex(s => s.ChordId);
            entity.HasIndex(s => s.PatternId);

            entity.Property(s => s.Lyric)
                .HasMaxLength(2000);

            entity.Property(s => s.Description)
                .HasMaxLength(1000);

            entity.Property(s => s.Color)
                .HasMaxLength(50);

            entity.Property(s => s.BackgroundColor)
                .HasMaxLength(50);

            entity.Property(s => s.ContentHash)
                .IsRequired()
                .HasMaxLength(64);

            entity.HasOne(s => s.Chord)
                .WithMany()
                .HasForeignKey(s => s.ChordId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Pattern)
                .WithMany()
                .HasForeignKey(s => s.PatternId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(s => s.Positions)
                .WithOne(p => p.Segment)
                .HasForeignKey(p => p.SegmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.SegmentLabels)
                .WithOne(sl => sl.Segment)
                .HasForeignKey(sl => sl.SegmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.Comments)
                .WithOne(c => c.Segment)
                .HasForeignKey(c => c.SegmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongSegmentPosition>(entity =>
        {
            entity.HasKey(sp => sp.Id);

            entity.HasIndex(sp => sp.SongId);
            entity.HasIndex(sp => sp.SegmentId);
            entity.HasIndex(sp => sp.PositionIndex);
            entity.HasIndex(sp => sp.RepeatGroup);
            entity.HasIndex(sp => new { sp.SongId, sp.PositionIndex }).IsUnique();

            entity.Property(sp => sp.RepeatGroup)
                .HasMaxLength(100);

            entity.HasOne(sp => sp.Song)
                .WithMany()
                .HasForeignKey(sp => sp.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sp => sp.Segment)
                .WithMany(s => s.Positions)
                .HasForeignKey(sp => sp.SegmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongLabel>(entity =>
        {
            entity.HasKey(sl => sl.Id);

            entity.HasIndex(sl => sl.Name).IsUnique();

            entity.Property(sl => sl.Name)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(sl => sl.Color)
                .HasMaxLength(50);

            entity.HasMany(sl => sl.SegmentLabels)
                .WithOne(sl => sl.Label)
                .HasForeignKey(sl => sl.LabelId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SegmentLabel>(entity =>
        {
            entity.HasKey(sl => sl.Id);

            entity.HasIndex(sl => new { sl.SegmentId, sl.LabelId }).IsUnique();
            entity.HasIndex(sl => sl.SegmentId);
            entity.HasIndex(sl => sl.LabelId);

            entity.HasOne(sl => sl.Segment)
                .WithMany(s => s.SegmentLabels)
                .HasForeignKey(sl => sl.SegmentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sl => sl.Label)
                .WithMany(l => l.SegmentLabels)
                .HasForeignKey(sl => sl.LabelId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongComment>(entity =>
        {
            entity.HasKey(sc => sc.Id);

            entity.HasIndex(sc => sc.SongId);
            entity.HasIndex(sc => sc.SegmentId);

            entity.Property(sc => sc.Text)
                .IsRequired()
                .HasMaxLength(1000);

            entity.HasOne(sc => sc.Song)
                .WithMany(s => s.Comments)
                .HasForeignKey(sc => sc.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sc => sc.Segment)
                .WithMany(s => s.Comments)
                .HasForeignKey(sc => sc.SegmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongChord>(entity =>
        {
            entity.HasKey(sc => sc.Id);

            entity.HasIndex(sc => new { sc.SongId, sc.ChordId }).IsUnique();
            entity.HasIndex(sc => sc.SongId);
            entity.HasIndex(sc => sc.ChordId);

            entity.HasOne(sc => sc.Song)
                .WithMany(s => s.SongChords)
                .HasForeignKey(sc => sc.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sc => sc.Chord)
                .WithMany(c => c.SongChords)
                .HasForeignKey(sc => sc.ChordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongPattern>(entity =>
        {
            entity.HasKey(sp => sp.Id);

            entity.HasIndex(sp => new { sp.SongId, sp.StrummingPatternId }).IsUnique();
            entity.HasIndex(sp => sp.SongId);
            entity.HasIndex(sp => sp.StrummingPatternId);

            entity.HasOne(sp => sp.Song)
                .WithMany(s => s.SongPatterns)
                .HasForeignKey(sp => sp.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sp => sp.StrummingPattern)
                .WithMany(sp => sp.SongPatterns)
                .HasForeignKey(sp => sp.StrummingPatternId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongReview>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.HasIndex(r => new { r.SongId, r.UserId }).IsUnique();
            entity.HasIndex(r => r.SongId);
            entity.HasIndex(r => r.UserId);
            entity.HasIndex(r => r.CreatedAt);
            entity.HasIndex(r => r.BeautifulLevel);
            entity.HasIndex(r => r.DifficultyLevel);

            entity.Property(r => r.ReviewText)
                .IsRequired()
                .HasMaxLength(5000);

            entity.Property(r => r.CreatedAt)
                .IsRequired();

            entity.HasOne(r => r.Song)
                .WithMany(s => s.Reviews)
                .HasForeignKey(r => r.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(r => r.Likes)
                .WithOne(l => l.Review)
                .HasForeignKey(l => l.ReviewId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReviewLike>(entity =>
        {
            entity.HasKey(rl => rl.Id);

            entity.HasIndex(rl => new { rl.ReviewId, rl.UserId }).IsUnique();
            entity.HasIndex(rl => rl.ReviewId);
            entity.HasIndex(rl => rl.UserId);
            entity.HasIndex(rl => rl.IsLike);

            entity.Property(rl => rl.CreatedAt)
                .IsRequired();

            entity.HasOne(rl => rl.Review)
                .WithMany(r => r.Likes)
                .HasForeignKey(rl => rl.ReviewId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(rl => rl.User)
                .WithMany(u => u.ReviewLikes)
                .HasForeignKey(rl => rl.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}