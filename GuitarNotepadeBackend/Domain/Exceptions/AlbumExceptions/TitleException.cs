using Domain.Exceptions.Base;

namespace Domain.Exceptions.AlbumExceptions;

public class NameException(string message) : BaseException($"Album Title: {message}") { }
