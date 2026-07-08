using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TimeReport.Api.Data;
using TimeReport.Api.Data.Entities;

namespace TimeReport.Api.Controllers;

[Route("api/tags")]
public class TagsController(AppDbContext db) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var tags = await db.Tags
            .Where(t => t.UserId == CurrentUserId)
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .ToListAsync();
        return Ok(tags.Select(ToDto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TagRequest req)
    {
        var name = req.Name.Trim();
        if (string.IsNullOrEmpty(name))
            return BadRequest(new { error = "Tag name is required" });
        if (await db.Tags.AnyAsync(t => t.UserId == CurrentUserId && t.Name == name))
            return BadRequest(new { error = "A tag with that name already exists" });

        var tag = new Tag
        {
            UserId = CurrentUserId,
            Name = name,
            Color = req.Color?.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Tags.Add(tag);
        await db.SaveChangesAsync();
        return Ok(ToDto(tag));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TagRequest req)
    {
        var tag = await db.Tags.FirstOrDefaultAsync(t => t.Id == id && t.UserId == CurrentUserId);
        if (tag is null) return NotFound();
        tag.Name = req.Name.Trim();
        tag.Color = req.Color?.Trim();
        tag.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(ToDto(tag));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        var tag = await db.Tags.FirstOrDefaultAsync(t => t.Id == id && t.UserId == CurrentUserId);
        if (tag is null) return NotFound();
        db.Tags.Remove(tag);
        await db.SaveChangesAsync();
        return Ok();
    }

    private static object ToDto(Tag t) => new { t.Id, t.Name, t.Color, t.CreatedAt, t.UpdatedAt };
}

public record TagRequest(string Name, string? Color);
