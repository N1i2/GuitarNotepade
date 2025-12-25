using Domain.Entities;
using Domain.Interfaces.Repositories;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
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
    }
}