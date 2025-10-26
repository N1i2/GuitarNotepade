using Domain.Exceptions.Base;

namespace Domain.Exceptions.SongExceptions;

public class LyricsException(string message) : BaseException($"Lyrics: {message}") { }
