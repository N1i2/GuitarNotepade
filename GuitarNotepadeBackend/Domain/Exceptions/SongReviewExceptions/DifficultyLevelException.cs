using Domain.Exceptions.Base;

namespace Domain.Exceptions.SongReviewExceptions;

public class DifficultyLevelException(string message) : BaseException($"Difficulty Level: {message}") { }
