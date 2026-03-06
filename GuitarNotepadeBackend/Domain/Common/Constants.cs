namespace Domain.Common;

public static class Constants
{
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 100;

    public static class Limits
    {
        public const int MaxSongsPerUser = 1000;
        public const int MaxReviewsPerUser = 500;
        public const int MaxPatternsPerUser = 200;
        public const int MaxChordsPerUser = 300;

        public const int MaxSegmentsPerSong = 255;
        public const int MaxSegmentPositionsPerSong = 1000;
        public const int MaxCommentsPerSong = 1000;
    }

    public static class Search
    {
        public const int MinSearchLength = 2;
        public const int MaxSearchResults = 100;
    }

    public static class Roles
    {
        public const string Admin = "Admin";
        public const string User = "User";
        public const string Guest = "Guest";
    }

    public static class Sorting
    {
        public const string Email = "email";
        public const string NikName = "nikName";
        public const string CreatedAt = "createdAt";
        public const string Title = "title";
        public const string UpdatedAt = "updatedAt";
        public const string AverageBeautiful = "averageBeautiful";
        public const string AverageDifficulty = "averageDifficulty";
        public const string ReviewCount = "reviewCount";

        public const string Ascending = "asc";
        public const string Descending = "desc";
    }

    public static class Review
    {
        public const int MinLength = 2;
        public const int MaxLength = 500;
        public const int MinRating = 1;
        public const int MaxRating = 5;
    }

    public static class Timeouts
    {
        public static readonly TimeSpan DefaultCacheDuration = TimeSpan.FromMinutes(5);
        public static readonly TimeSpan AvatarCacheDuration = TimeSpan.FromHours(1);
    }

    public static class AudioTypes
    {
        public static readonly string FileType = "File";
        public static readonly string UrlType = "Url";
    }
}