namespace Domain.Interfaces.Services;

public interface ISongStatisticsService
{
    Task<Dictionary<string, object>> GetSongStatsAsync(
        Guid songId,
        CancellationToken cancellationToken = default);

    Task<Dictionary<string, object>> GetUserSongStatsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<List<(string period, int count)>> GetSongCreationTrendAsync(
        DateTime fromDate,
        DateTime toDate,
        Guid? userId = null,
        CancellationToken cancellationToken = default);

    Task<Dictionary<string, int>> GetPopularChordsStatsAsync(
        int topN = 10,
        Guid? userId = null,
        CancellationToken cancellationToken = default);

    Task<Dictionary<string, int>> GetPopularPatternsStatsAsync(
        int topN = 10,
        Guid? userId = null,
        CancellationToken cancellationToken = default);

    Task<Dictionary<string, decimal>> GetAverageRatingsStatsAsync(
        Guid? userId = null,
        CancellationToken cancellationToken = default);

    Task<List<(Guid songId, string title, int views, int likes)>> GetTopSongsAsync(
        int limit = 10,
        TimeSpan? period = null,
        CancellationToken cancellationToken = default);
}