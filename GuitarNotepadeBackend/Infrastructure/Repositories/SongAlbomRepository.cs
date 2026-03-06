using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SongAlbomRepository : BaseRepository<SongAlbum>, ISongAlbomRepository
{
    public SongAlbomRepository(AppDbContext context) : base(context) { }

    public async Task<SongAlbum?> GetByAlbumAndSongAsync(Guid albumId, Guid songId, CancellationToken cancellationToken = default)
    {
        return await _context.SongAlbums
            .FirstOrDefaultAsync(sa => sa.AlbumId == albumId && sa.SongId == songId, cancellationToken);
    }

    public async Task<List<SongAlbum>> GetByAlbumIdAsync(Guid albumId, CancellationToken cancellationToken = default)
    {
        return await _context.SongAlbums
            .Where(sa => sa.AlbumId == albumId)
            .Include(sa => sa.Song)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SongAlbum>> GetBySongIdAsync(Guid songId, CancellationToken cancellationToken = default)
    {
        return await _context.SongAlbums
            .Where(sa => sa.SongId == songId)
            .Include(sa => sa.Album)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountByAlbumIdAsync(Guid albumId, CancellationToken cancellationToken = default)
    {
        return await _context.SongAlbums
            .CountAsync(sa => sa.AlbumId == albumId, cancellationToken);
    }

    public async Task<bool> ExistsAsync(Guid albumId, Guid songId, CancellationToken cancellationToken = default)
    {
        return await _context.SongAlbums
            .AnyAsync(sa => sa.AlbumId == albumId && sa.SongId == songId, cancellationToken);
    }

    public async Task DeleteByAlbumAndSongAsync(Guid albumId, Guid songId, CancellationToken cancellationToken = default)
    {
        var songAlbum = await GetByAlbumAndSongAsync(albumId, songId, cancellationToken);
        if (songAlbum != null)
        {
            await DeleteAsync(songAlbum.Id, cancellationToken);
        }
    }

    public async Task<List<Song>> GetSongsByAlbumIdAsync(Guid albumId, CancellationToken cancellationToken = default)
    {
        return await _context.SongAlbums
            .Where(sa => sa.AlbumId == albumId)
            .Include(sa => sa.Song)
                .ThenInclude(s => s.Owner)
            .Include(sa => sa.Song)
                .ThenInclude(s => s.SongChords)
            .Include(sa => sa.Song)
                .ThenInclude(s => s.SongPatterns)
            .Include(sa => sa.Song)
                .ThenInclude(s => s.Reviews)
            .Include(sa => sa.Song)
                .ThenInclude(s => s.Comments)
            .Select(sa => sa.Song)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Album>> GetAlbumsBySongIdAsync(Guid songId, CancellationToken cancellationToken = default)
    {
        return await _context.SongAlbums
            .Where(sa => sa.SongId == songId)
            .Include(sa => sa.Album)
            .Select(sa => sa.Album)
            .ToListAsync(cancellationToken);
    }
}
