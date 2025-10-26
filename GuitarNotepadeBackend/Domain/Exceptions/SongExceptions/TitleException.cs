using Domain.Exceptions.Base;

namespace Domain.Exceptions.SongExceptions;

public class TitleException(string message) : BaseException($"Song Title: {message}") { }
