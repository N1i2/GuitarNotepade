using Application.Features.Commands.Songs;
using FluentValidation;

namespace Application.Validations;

public class UpdateSongCommandValidator : AbstractValidator<UpdateSongCommand>
{
    public UpdateSongCommandValidator()
    {
        RuleFor(x => x.SongId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Dto).NotNull();
    }
}