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

        public const string Ascending = "asc";
        public const string Descending = "desc";
    }
}
