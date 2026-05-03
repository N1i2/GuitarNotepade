using Domain.Exceptions.Base;

namespace Domain.Exceptions.AlbumExceptions;

public class TitleException(string message) : BaseException($"Album Title: {message}") { }
