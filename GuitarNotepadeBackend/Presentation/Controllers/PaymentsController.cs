using Application.DTOs.Payments;
using Application.Features.Commands.Payments;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentsController : ApiControllerBase
{
    private readonly IMediator _mediator;

    public PaymentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Pay premium
    /// </summary>
    /// <param name="dto"></param>
    /// <returns></returns>
    [HttpPost("upgrade-to-premium")]
    public async Task<ActionResult<PremiumUpgradeResultDto>> UpgradeToPremium([FromBody] UpgradeToPremiumDto dto)
    {
        try
        {
            var userId = GetCurrentUserId();
            var command = new UpgradeToPremiumCommand(userId, dto.PaymentMethod, dto.PaymentToken);
            var result = await _mediator.Send(command);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
