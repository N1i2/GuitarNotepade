namespace Application.DTOs.Reviews;

public class UpdateReviewRequestDto
{
    public string? ReviewText { get; set; } 
    public int? BeautifulLevel { get; set; }
    public int? DifficultyLevel { get; set; }
}