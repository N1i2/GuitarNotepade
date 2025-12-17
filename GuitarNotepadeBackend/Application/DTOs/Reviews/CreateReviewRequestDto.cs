namespace Application.DTOs.Reviews;

public class CreateReviewRequestDto
{
    public string ReviewText { get; set; } = string.Empty;
    public int? BeautifulLevel { get; set; }
    public int? DifficultyLevel { get; set; }
}