using Domain.Exceptions.Base;

namespace Domain.Exceptions.ThemeExceptions;

public class DescriptionException(string message) : BaseException($"Theme Description: {message}") { }
