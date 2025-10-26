using Domain.Exceptions.Base;

namespace Domain.Exceptions.ThemeExceptions;

public class NameException(string message) : BaseException($"Theme Name: {message}") { }
