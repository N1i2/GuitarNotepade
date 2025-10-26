using Domain.Exceptions.Base;

namespace Domain.Exceptions.SongExceptions;

public class DifficultyLevelException(string message) : BaseException($"Difficulty Level: {message}") { }
