using Domain.Exceptions.Base;

namespace Domain.Exceptions.StrummingPatternsExceptions;

public class NameException(string message) : BaseException($"Strumming Patterns Name: {message}") { }
