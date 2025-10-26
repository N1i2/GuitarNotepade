using Domain.Exceptions.Base;

namespace Domain.Exceptions.SongReviewExceptions;

public class RatingException(string message) : BaseException($"Rating: {message}") { }
