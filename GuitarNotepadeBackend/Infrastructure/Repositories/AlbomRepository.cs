using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class AlbomRepository : BaseRepository<Album>, IAlbomRepository
{
    public AlbomRepository(AppDbContext context) : base(context) { }

    public async Task<Album?> GetByTitleAndOwnerAsync(string title, Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.Albums
            .FirstOrDefaultAsync(a =>
                a.Title.ToLower() == title.ToLower() &&
                a.OwnerId == ownerId,
                cancellationToken);
    }

    public async Task<Album?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Albums
            .Include(a => a.Owner)
            .Include(a => a.SongAlbums)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<Album?> FindAsync(Func<Album, bool> predicate, CancellationToken cancellationToken = default)
    {
        return await Task.Run(() =>
            _context.Albums
                .Include(a => a.SongAlbums)
                .AsEnumerable()
                .FirstOrDefault(predicate),
            cancellationToken);
    }

    public async Task<bool> IsSongInAlbumAsync(Guid albumId, Guid songId, CancellationToken cancellationToken = default)
    {
        return await _context.SongAlbums
            .AnyAsync(sa => sa.AlbumId == albumId && sa.SongId == songId, cancellationToken);
    }

    public async Task<bool> ExistsByTitleAndOwnerAsync(string title, Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.Albums
            .AnyAsync(a =>
                a.Title.ToLower() == title.ToLower() &&
                a.OwnerId == ownerId,
                cancellationToken);
    }
}
