namespace Domain.Common;

public static class Constants
{
    public const int DefaultPageSize = 10;
    public const int MaxPageSize = 100;

    public static class Roles
    {
        public const string Admin = "Admin";
        public const string User = "User";
    }

    public static class Sorting
    {
        public const string Email = "email";
        public const string NikName = "nikName";
        public const string CreatedAt = "createdAt";
        public const string Title = "title";
        public const string UpdatedAt = "updatedAt";

        public const string Ascending = "asc";
        public const string Descending = "desc";
    }

    public static class Review
    {
        public const int MinLength = 500;
        public const int MaxLength = 5000;
        public const int MinRating = 1;
        public const int MaxRating = 5;
    }

    public static class Limits
    {
        public const int MaxSongsPerUser = 1000;
        public const int MaxReviewsPerUser = 500;
        public const int MaxPatternsPerUser = 200;
        public const int MaxChordsPerUser = 300;
        public const int MaxReviewLength = 5000;
        public const int MinReviewLength = 50; 
    }

    public static class Timeouts
    {
        public static readonly TimeSpan DefaultCacheDuration = TimeSpan.FromMinutes(5);
        public static readonly TimeSpan AvatarCacheDuration = TimeSpan.FromHours(1);
    }
}