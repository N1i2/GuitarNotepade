using Domain.Exceptions.Base;

namespace Domain.Exceptions.GenreExceptions;

public class FingerPositionException(string message) : BaseException($"Genre Description: {message}") { }
