using Domain.Exceptions.Base;

namespace Domain.Exceptions.SongReviewExceptions;

public class ReviewTextException(string message) : BaseException($"Review Text: {message}") { }
