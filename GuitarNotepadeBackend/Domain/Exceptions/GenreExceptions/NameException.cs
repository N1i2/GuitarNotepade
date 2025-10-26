using Domain.Exceptions.Base;

namespace Domain.Exceptions.GenreExceptions;

public class NameException(string message) : BaseException($"Genre Name: {message}") { }
