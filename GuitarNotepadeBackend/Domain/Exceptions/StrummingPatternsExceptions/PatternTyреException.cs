using Domain.Exceptions.Base;

namespace Domain.Exceptions.StrummingPatternsExceptions;

public class PatternTyреException(string message) : BaseException($"Pattern Tyре: {message}") { }
