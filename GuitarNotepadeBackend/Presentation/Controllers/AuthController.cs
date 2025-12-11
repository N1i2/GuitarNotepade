using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Application.DTOs.Users;
using Application.Features.Commands.Users;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMapper _mapper;

    public AuthController(IMediator mediator, IMapper mapper)
    {
        _mediator = mediator;
        _mapper = mapper;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody]RegisterUserDto dto)
    {
        try
        {
            var command = _mapper.Map<RegisterUserCommand>(dto);

            var result = await _mediator.Send(command);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody]LoginUserDto dto)
    {
        try
        {
            var command = _mapper.Map<LoginUserCommand>(dto);

            var result = await _mediator.Send(command);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}