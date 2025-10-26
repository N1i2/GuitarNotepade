using Domain.Exceptions.Base;

namespace Domain.Exceptions.StrummingPatternsExceptions;

public class PatternException(string message) : BaseException($"Pattern: {message}") { }
