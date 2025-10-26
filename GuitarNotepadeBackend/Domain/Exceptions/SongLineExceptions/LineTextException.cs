using Domain.Exceptions.Base;

namespace Domain.Exceptions.SongLineExceptions;

public class LineTextException(string message) : BaseException($"Line Text: {message}") { }
