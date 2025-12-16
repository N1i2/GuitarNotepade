using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Chord> Chords => Set<Chord>();
    public DbSet<StrummingPattern> StrummingPatterns => Set<StrummingPattern>();
    public DbSet<SongChord> SongChords => Set<SongChord>();
    public DbSet<SongPattern> SongPatterns => Set<SongPattern>();
    public DbSet<Song> Songs => Set<Song>();

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

            entity.HasOne(c => c.CreatedBy)
                .WithMany()
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

            entity.HasOne(sp => sp.CreatedBy)
                .WithMany()
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
            entity.HasIndex(s => s.ParentsSongId);

            entity.Property(s => s.Title)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(s => s.Lyrics)
                .IsRequired()
                .HasColumnType("text");

            entity.Property(s => s.Artist)
                .HasMaxLength(200);

            entity.HasOne(s => s.Owner)
                .WithMany(u => u.Songs)
                .HasForeignKey(s => s.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.ParentSong)
                .WithMany(s => s.ChildSongs)
                .HasForeignKey(s => s.ParentsSongId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(s => s.Chords)
                .WithOne(sc => sc.Song)
                .HasForeignKey(sc => sc.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(s => s.Patterns)
                .WithOne(sp => sp.Song)
                .HasForeignKey(sp => sp.SongId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongChord>(entity =>
        {
            entity.HasKey(sc => new { sc.SongId, sc.ChordId });

            entity.HasIndex(sc => sc.SongId);
            entity.HasIndex(sc => sc.ChordId);

            entity.HasOne(sc => sc.Song)
                .WithMany(s => s.Chords)
                .HasForeignKey(sc => sc.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sc => sc.Chord)
                .WithMany(c => c.SongChords)
                .HasForeignKey(sc => sc.ChordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SongPattern>(entity =>
        {
            entity.HasKey(sp => new { sp.SongId, sp.StrummingPatternId });

            entity.HasIndex(sp => sp.SongId);
            entity.HasIndex(sp => sp.StrummingPatternId);

            entity.HasOne(sp => sp.Song)
                .WithMany(s => s.Patterns)
                .HasForeignKey(sp => sp.SongId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sp => sp.StrummingPattern)
                .WithMany(sp => sp.SongPatterns)
                .HasForeignKey(sp => sp.StrummingPatternId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}