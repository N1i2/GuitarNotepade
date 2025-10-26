using Domain.Exceptions.Base;

namespace Domain.Exceptions.SongExceptions;

public class OriginalArtistException(string message) : BaseException($"Original Artist: {message}") { }
