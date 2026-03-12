using ConsoleTables;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Net.Http.Headers;
using System.Text;

namespace Tests;

public class Program
{
    private static readonly HttpClient _httpClient = new();
    private static string _baseUrl = "http://localhost:3001/api";
    private static string? _token;
    private static string? _currentUserId;
    private static string? _currentUserRole;

    static async Task Main(string[] args)
    {
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("==========================================");
        Console.WriteLine("   GUITAR NOTEPAD API TEST CONSOLE");
        Console.WriteLine("==========================================");
        Console.ResetColor();
        Console.WriteLine();

        while (true)
        {
            try
            {
                await ShowMainMenu();
            }
            catch (Exception ex)
            {
                WriteError($"Unexpected error: {ex.Message}");
            }
        }
    }

    private static async Task ShowMainMenu()
    {
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Yellow;
        Console.WriteLine("╔══════════════════════════════════════╗");
        Console.WriteLine("║             MAIN MENU                ║");
        Console.WriteLine("╚══════════════════════════════════════╝");
        Console.ResetColor();
        Console.WriteLine();

        if (!string.IsNullOrEmpty(_token))
        {
            Console.WriteLine($"Logged in as: {_currentUserId} ({_currentUserRole})");
            Console.WriteLine();
        }

        var menuItems = new Dictionary<int, (string Description, Func<Task> Action)>
            {
                {1, new ValueTuple<string, Func<Task>>("Authentication (Register/Login)", TestAuthentication)},
                {2, new ValueTuple<string, Func<Task>>("User Profile", TestUserProfile)},
                {3, new ValueTuple<string, Func<Task>>("Admin User Management", TestUserManagement)},
                {4, new ValueTuple<string, Func<Task>>("Chords", TestChords)},
                {5, new ValueTuple<string, Func<Task>>("Strumming Patterns", TestPatterns)},
                {6, new ValueTuple<string, Func<Task>>("Songs", TestSongs)},
                {7, new ValueTuple<string, Func<Task>>("Albums", TestAlbums)},
                {8, new ValueTuple<string, Func<Task>>("Reviews", TestReviews)},
                {9, new ValueTuple<string, Func<Task>>("Subscriptions (NEW!)", TestSubscriptions)},
                {10, new ValueTuple<string, Func<Task>>("Premium Upgrade (NEW!)", TestPremiumUpgrade)},
                {0, new ValueTuple<string, Func<Task>>("Exit", () => { Environment.Exit(0); return Task.CompletedTask; })}
            };

        foreach (var item in menuItems)
        {
            Console.WriteLine($"{item.Key,2}. {item.Value.Description}");
        }

        Console.Write("\nSelect option: ");
        var input = Console.ReadLine();

        if (int.TryParse(input, out int choice) && menuItems.ContainsKey(choice))
        {
            await menuItems[choice].Action();
        }
        else
        {
            WriteError("Invalid option");
        }
    }

    #region Authentication Tests

    private static async Task TestAuthentication()
    {
        WriteHeader("AUTHENTICATION TESTS");

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
    {
        {1, (Description: "Register new user", Action: TestRegister)},
        {2, (Description: "Login", Action: async () => await TestLogin())},
        {3, (Description: "Clear token (logout)", Action: () => {
            _token = null;
            _currentUserId = null;
            _currentUserRole = null;
            WriteSuccess("Token cleared");
            return Task.CompletedTask;
        })},
        {0, (Description: "Back to main menu", Action: async () => await Task.CompletedTask)}
    };

        await RunSubMenu(menu);
    }

    private static async Task TestRegister()
    {
        WriteSubHeader("REGISTER");

        var timestamp = DateTime.Now.Ticks.ToString().Substring(10);
        var email = $"test{timestamp}@example.com";
        var nickName = $"testuser{timestamp}";
        var password = "Test123!";

        Console.WriteLine($"Registering with:");
        Console.WriteLine($"  Email: {email}");
        Console.WriteLine($"  NickName: {nickName}");
        Console.WriteLine($"  Password: {password}");

        var request = new
        {
            Email = email,
            NikName = nickName,
            Password = password,
            ConfirmPassword = password
        };

        var response = await PostAsync("/auth/register", request);

        if (response != null)
        {
            WriteSuccess("Registration successful!");
            LogResponse(response);

            // Auto-login after registration
            await TestLogin(email, password);
        }
    }

    private static async Task TestLogin(string? email = null, string? password = null)
    {
        WriteSubHeader("LOGIN");

        if (email == null)
        {
            Console.Write("Email: ");
            email = Console.ReadLine()!;

            Console.Write("Password: ");
            password = Console.ReadLine()!;
        }

        var request = new
        {
            Email = email,
            Password = password
        };

        var response = await PostAsync("/auth/login", request);

        if (response != null)
        {
            _token = response.token;
            _currentUserId = response.userId;
            _currentUserRole = response.role;

            WriteSuccess("Login successful!");
            LogResponse(response);
        }
    }

    #endregion

    #region User Profile Tests

    private static async Task TestUserProfile()
    {
        WriteHeader("USER PROFILE TESTS");

        if (!await EnsureAuthenticated()) return;

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
        {
            {1, ("Get profile", TestGetProfile)},
            {2, ("Update profile", TestUpdateProfile)},
            {3, ("Change password", TestChangePassword)},
            {0, ("Back to main menu", async () => await Task.CompletedTask)}
        };

        await RunSubMenu(menu);
    }

    private static async Task TestGetProfile()
    {
        WriteSubHeader("GET PROFILE");

        var response = await GetAsync("/user/profile");

        if (response != null)
        {
            WriteSuccess("Profile retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestUpdateProfile()
    {
        WriteSubHeader("UPDATE PROFILE");

        Console.Write("New nickname (leave empty to skip): ");
        var nickName = Console.ReadLine();

        Console.Write("New bio (leave empty to skip): ");
        var bio = Console.ReadLine();

        var request = new
        {
            UserId = _currentUserId,
            NikName = string.IsNullOrEmpty(nickName) ? null : nickName,
            Bio = string.IsNullOrEmpty(bio) ? null : bio,
            RemoveAvatar = false
        };

        var response = await PutAsync("/user/profile", request);

        if (response != null)
        {
            WriteSuccess("Profile updated!");
            LogResponse(response);
        }
    }

    private static async Task TestChangePassword()
    {
        WriteSubHeader("CHANGE PASSWORD");

        Console.Write("Current password: ");
        var currentPassword = Console.ReadLine()!;

        Console.Write("New password: ");
        var newPassword = Console.ReadLine()!;

        Console.Write("Confirm new password: ");
        var confirmPassword = Console.ReadLine()!;

        var request = new
        {
            CurrentPassword = currentPassword,
            NewPassword = newPassword,
            ConfirmNewPassword = confirmPassword
        };

        var response = await PutAsync("/user/change-password", request);

        if (response != null)
        {
            WriteSuccess("Password changed!");
        }
        else
        {
            // PUT with no content returns 204
            WriteSuccess("Password changed (no content)");
        }
    }

    #endregion

    #region Admin User Management Tests

    private static async Task TestUserManagement()
    {
        WriteHeader("ADMIN USER MANAGEMENT TESTS");

        if (!await EnsureAuthenticated() || !await EnsureAdmin()) return;

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
        {
            {1, ("Get all users", TestGetAllUsers)},
            {2, ("Block user", TestBlockUser)},
            {3, ("Unblock user", TestUnblockUser)},
            {4, ("Toggle user role", TestToggleUserRole)},
            {0, ("Back to main menu", async () => await Task.CompletedTask)}
        };

        await RunSubMenu(menu);
    }

    private static async Task TestGetAllUsers()
    {
        WriteSubHeader("GET ALL USERS");

        Console.Write("Email filter (optional): ");
        var emailFilter = Console.ReadLine();

        Console.Write("Nickname filter (optional): ");
        var nikNameFilter = Console.ReadLine();

        var query = new List<string>();
        if (!string.IsNullOrEmpty(emailFilter)) query.Add($"emailFilter={Uri.EscapeDataString(emailFilter)}");
        if (!string.IsNullOrEmpty(nikNameFilter)) query.Add($"nikNameFilter={Uri.EscapeDataString(nikNameFilter)}");
        query.Add("page=1");
        query.Add("pageSize=10");

        var url = "/usermanagement/users?" + string.Join("&", query);
        var response = await GetAsync(url);

        if (response != null)
        {
            WriteSuccess("Users retrieved!");
            LogResponse(response);

            // Display as table
            if (response.items != null)
            {
                var table = new ConsoleTable("ID", "Email", "NickName", "Role", "IsBlocked");
                foreach (var user in response.items)
                {
                    table.AddRow(
                        user.id?.ToString()?[..8] + "...",
                        user.email,
                        user.nikName,
                        user.role,
                        user.isBlocked ? "Yes" : "No"
                    );
                }
                table.Write();
            }
        }
    }

    private static async Task TestBlockUser()
    {
        WriteSubHeader("BLOCK USER");

        Console.Write("User email to block: ");
        var email = Console.ReadLine()!;

        Console.Write("Block reason: ");
        var reason = Console.ReadLine()!;

        Console.Write("Block duration in days: ");
        if (!int.TryParse(Console.ReadLine(), out int days))
        {
            WriteError("Invalid number");
            return;
        }

        var blockedUntil = DateTime.UtcNow.AddDays(days);

        var request = new
        {
            Email = email,
            Reason = reason,
            BlockedUntil = blockedUntil
        };

        var response = await PutAsync("/usermanagement/block-user", request);

        if (response != null)
        {
            WriteSuccess("User blocked!");
            LogResponse(response);
        }
    }

    private static async Task TestUnblockUser()
    {
        WriteSubHeader("UNBLOCK USER");

        Console.Write("User email to unblock: ");
        var email = Console.ReadLine()!;

        var request = new { Email = email };
        var response = await PutAsync("/usermanagement/unblock-user", request);

        if (response != null)
        {
            WriteSuccess("User unblocked!");
            LogResponse(response);
        }
    }

    private static async Task TestToggleUserRole()
    {
        WriteSubHeader("TOGGLE USER ROLE");

        Console.Write("User email to toggle role: ");
        var email = Console.ReadLine()!;

        var request = new { Email = email };
        var response = await PutAsync("/usermanagement/toggle-user-role", request);

        if (response != null)
        {
            WriteSuccess("Role toggled!");
            LogResponse(response);
        }
    }

    #endregion

    #region Chords Tests

    private static async Task TestChords()
    {
        WriteHeader("CHORDS TESTS");

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
        {
            {1, ("Get all chords", TestGetAllChords)},
            {2, ("Get chord by ID", TestGetChordById)},
            {3, ("Get chords by exact name", TestGetChordsByExactName)},
            {4, ("Search chords by name", TestSearchChords)},
            {5, ("Get my chords", TestGetMyChords)},
            {6, ("Create chord", TestCreateChord)},
            {7, ("Update chord", TestUpdateChord)},
            {8, ("Delete chord", TestDeleteChord)},
            {0, ("Back to main menu", async () => await Task.CompletedTask)}
        };

        await RunSubMenu(menu);
    }

    private static async Task TestGetAllChords()
    {
        WriteSubHeader("GET ALL CHORDS");

        var response = await GetAsync("/chords?page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("Chords retrieved!");
            LogResponse(response);

            if (response.items != null)
            {
                var table = new ConsoleTable("ID", "Name", "Fingering", "CreatedBy");
                foreach (var chord in response.items)
                {
                    table.AddRow(
                        chord.id?.ToString()?[..8] + "...",
                        chord.name,
                        chord.fingering,
                        chord.createdByNikName ?? "Unknown"
                    );
                }
                table.Write();
            }
        }
    }

    private static async Task TestGetChordById()
    {
        WriteSubHeader("GET CHORD BY ID");

        Console.Write("Chord ID: ");
        var id = Console.ReadLine()!;

        var response = await GetAsync($"/chords/{id}");

        if (response != null)
        {
            WriteSuccess("Chord retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetChordsByExactName()
    {
        WriteSubHeader("GET CHORDS BY EXACT NAME");

        Console.Write("Chord name: ");
        var name = Console.ReadLine()!;

        var response = await GetAsync($"/chords/exact/{Uri.EscapeDataString(name)}?page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("Chords retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestSearchChords()
    {
        WriteSubHeader("SEARCH CHORDS BY NAME");

        Console.Write("Search term: ");
        var term = Console.ReadLine()!;

        var response = await GetAsync($"/chords/search?name={Uri.EscapeDataString(term)}&page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("Search results!");
            LogResponse(response);
        }
    }

    private static async Task TestGetMyChords()
    {
        WriteSubHeader("GET MY CHORDS");

        if (!await EnsureAuthenticated()) return;

        var response = await GetAsync("/chords/my-chords?page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("My chords retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestCreateChord()
    {
        WriteSubHeader("CREATE CHORD");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Chord name (e.g., Am): ");
        var name = Console.ReadLine()!;

        Console.Write("Fingering (e.g., 0-0-2-2-1-0): ");
        var fingering = Console.ReadLine()!;

        Console.Write("Description (optional): ");
        var description = Console.ReadLine();

        var request = new
        {
            Name = name,
            Fingering = fingering,
            Description = string.IsNullOrEmpty(description) ? null : description
        };

        var response = await PostAsync("/chords", request);

        if (response != null)
        {
            WriteSuccess("Chord created!");
            LogResponse(response);
        }
    }

    private static async Task TestUpdateChord()
    {
        WriteSubHeader("UPDATE CHORD");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Chord ID to update: ");
        var id = Console.ReadLine()!;

        Console.Write("New name (leave empty to skip): ");
        var name = Console.ReadLine();

        Console.Write("New fingering (leave empty to skip): ");
        var fingering = Console.ReadLine();

        Console.Write("New description (leave empty to skip): ");
        var description = Console.ReadLine();

        var request = new
        {
            Name = string.IsNullOrEmpty(name) ? null : name,
            Fingering = string.IsNullOrEmpty(fingering) ? null : fingering,
            Description = string.IsNullOrEmpty(description) ? null : description
        };

        var response = await PutAsync($"/chords/{id}", request);

        if (response != null)
        {
            WriteSuccess("Chord updated!");
            LogResponse(response);
        }
    }

    private static async Task TestDeleteChord()
    {
        WriteSubHeader("DELETE CHORD");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Chord ID to delete: ");
        var id = Console.ReadLine()!;

        try
        {
            var response = await DeleteAsync($"/chords/{id}");
            WriteSuccess("Chord deleted!");
        }
        catch (Exception ex)
        {
            WriteError($"Failed to delete: {ex.Message}");
        }
    }

    #endregion

    #region Patterns Tests

    private static async Task TestPatterns()
    {
        WriteHeader("STRUMMING PATTERNS TESTS");

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
        {
            {1, ("Get all patterns", TestGetAllPatterns)},
            {2, ("Get pattern by ID", TestGetPatternById)},
            {3, ("Search patterns", TestSearchPatterns)},
            {4, ("Get my patterns", TestGetMyPatterns)},
            {5, ("Create pattern", TestCreatePattern)},
            {6, ("Update pattern", TestUpdatePattern)},
            {7, ("Delete pattern", TestDeletePattern)},
            {0, ("Back to main menu", async () => await Task.CompletedTask)}
        };

        await RunSubMenu(menu);
    }

    private static async Task TestGetAllPatterns()
    {
        WriteSubHeader("GET ALL PATTERNS");

        var response = await GetAsync("/strummingpatterns?page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("Patterns retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetPatternById()
    {
        WriteSubHeader("GET PATTERN BY ID");

        Console.Write("Pattern ID: ");
        var id = Console.ReadLine()!;

        var response = await GetAsync($"/strummingpatterns/{id}");

        if (response != null)
        {
            WriteSuccess("Pattern retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestSearchPatterns()
    {
        WriteSubHeader("SEARCH PATTERNS");

        Console.Write("Search term: ");
        var term = Console.ReadLine()!;

        var response = await GetAsync($"/strummingpatterns/search?name={Uri.EscapeDataString(term)}&page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("Search results!");
            LogResponse(response);
        }
    }

    private static async Task TestGetMyPatterns()
    {
        WriteSubHeader("GET MY PATTERNS");

        if (!await EnsureAuthenticated()) return;

        var response = await GetAsync("/strummingpatterns/my-patterns?page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("My patterns retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestCreatePattern()
    {
        WriteSubHeader("CREATE PATTERN");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Pattern name: ");
        var name = Console.ReadLine()!;

        Console.Write("Pattern (e.g., D-DU-UDU): ");
        var pattern = Console.ReadLine()!;

        Console.Write("Is fingerstyle? (y/n): ");
        var isFingerStyle = Console.ReadLine()?.ToLower() == "y";

        Console.Write("Description (optional): ");
        var description = Console.ReadLine();

        var request = new
        {
            Name = name,
            Pattern = pattern,
            IsFingerStyle = isFingerStyle,
            Description = string.IsNullOrEmpty(description) ? null : description
        };

        var response = await PostAsync("/strummingpatterns", request);

        if (response != null)
        {
            WriteSuccess("Pattern created!");
            LogResponse(response);
        }
    }

    private static async Task TestUpdatePattern()
    {
        WriteSubHeader("UPDATE PATTERN");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Pattern ID to update: ");
        var id = Console.ReadLine()!;

        Console.Write("New name (leave empty to skip): ");
        var name = Console.ReadLine();

        Console.Write("New pattern (leave empty to skip): ");
        var pattern = Console.ReadLine();

        Console.Write("Is fingerstyle? (leave empty to skip, y/n): ");
        var isFingerStyleInput = Console.ReadLine();
        bool? isFingerStyle = null;
        if (!string.IsNullOrEmpty(isFingerStyleInput))
        {
            isFingerStyle = isFingerStyleInput.ToLower() == "y";
        }

        Console.Write("New description (leave empty to skip): ");
        var description = Console.ReadLine();

        var request = new
        {
            Name = string.IsNullOrEmpty(name) ? null : name,
            Pattern = string.IsNullOrEmpty(pattern) ? null : pattern,
            IsFingerStyle = isFingerStyle,
            Description = string.IsNullOrEmpty(description) ? null : description
        };

        var response = await PutAsync($"/strummingpatterns/{id}", request);

        if (response != null)
        {
            WriteSuccess("Pattern updated!");
            LogResponse(response);
        }
    }

    private static async Task TestDeletePattern()
    {
        WriteSubHeader("DELETE PATTERN");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Pattern ID to delete: ");
        var id = Console.ReadLine()!;

        try
        {
            await DeleteAsync($"/strummingpatterns/{id}");
            WriteSuccess("Pattern deleted!");
        }
        catch (Exception ex)
        {
            WriteError($"Failed to delete: {ex.Message}");
        }
    }

    #endregion

    #region Songs Tests

    private static async Task TestSongs()
    {
        WriteHeader("SONGS TESTS");

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
        {
            {1, ("Search songs", TestSearchSongs)},
            {2, ("Get song by ID", TestGetSongById)},
            {3, ("Get user songs", TestGetUserSongs)},
            {4, ("Get my songs", TestGetMySongs)},
            {5, ("Create song", TestCreateSong)},
            {6, ("Update song", TestUpdateSong)},
            {7, ("Delete song", TestDeleteSong)},
            {8, ("Build song structure", TestBuildSongStructure)},
            {9, ("Add chord to song", TestAddChordToSong)},
            {10, ("Add pattern to song", TestAddPatternToSong)},
            {0, ("Back to main menu", async () => await Task.CompletedTask)}
        };

        await RunSubMenu(menu);
    }

    private static async Task TestSearchSongs()
    {
        WriteSubHeader("SEARCH SONGS");

        Console.Write("Search term (optional): ");
        var searchTerm = Console.ReadLine();

        var query = new List<string>();
        if (!string.IsNullOrEmpty(searchTerm)) query.Add($"searchTerm={Uri.EscapeDataString(searchTerm)}");
        query.Add("page=1");
        query.Add("pageSize=10");

        var response = await GetAsync("/songs?" + string.Join("&", query));

        if (response != null)
        {
            WriteSuccess("Songs retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetSongById()
    {
        WriteSubHeader("GET SONG BY ID");

        Console.Write("Song ID: ");
        var id = Console.ReadLine()!;

        Console.Write("Include structure? (y/n): ");
        var includeStructure = Console.ReadLine()?.ToLower() == "y";

        Console.Write("Include chords? (y/n): ");
        var includeChords = Console.ReadLine()?.ToLower() == "y";

        Console.Write("Include patterns? (y/n): ");
        var includePatterns = Console.ReadLine()?.ToLower() == "y";

        var query = new List<string>();
        if (includeStructure) query.Add("includeStructure=true");
        if (includeChords) query.Add("includeChords=true");
        if (includePatterns) query.Add("includePatterns=true");

        var url = $"/songs/{id}" + (query.Any() ? "?" + string.Join("&", query) : "");
        var response = await GetAsync(url);

        if (response != null)
        {
            WriteSuccess("Song retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetUserSongs()
    {
        WriteSubHeader("GET USER SONGS");

        Console.Write("User ID: ");
        var userId = Console.ReadLine()!;

        Console.Write("Include private? (y/n): ");
        var includePrivate = Console.ReadLine()?.ToLower() == "y";

        var response = await GetAsync($"/songs/user/{userId}?includePrivate={includePrivate}&page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("User songs retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetMySongs()
    {
        WriteSubHeader("GET MY SONGS");

        if (!await EnsureAuthenticated()) return;

        var response = await GetAsync("/songs/my-songs?includePrivate=true&page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("My songs retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestCreateSong()
    {
        WriteSubHeader("CREATE SONG");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Title: ");
        var title = Console.ReadLine()!;

        Console.Write("Artist (optional): ");
        var artist = Console.ReadLine();

        Console.Write("Genre (optional): ");
        var genre = Console.ReadLine();

        Console.Write("Theme (optional): ");
        var theme = Console.ReadLine();

        Console.Write("Description (optional): ");
        var description = Console.ReadLine();

        Console.Write("Is public? (y/n): ");
        var isPublic = Console.ReadLine()?.ToLower() == "y";

        var request = new
        {
            Title = title,
            Artist = string.IsNullOrEmpty(artist) ? null : artist,
            Genre = string.IsNullOrEmpty(genre) ? null : genre,
            Theme = string.IsNullOrEmpty(theme) ? null : theme,
            Description = string.IsNullOrEmpty(description) ? null : description,
            IsPublic = isPublic
        };

        var response = await PostAsync("/songs", request);

        if (response != null)
        {
            WriteSuccess("Song created!");
            LogResponse(response);
        }
    }

    private static async Task TestUpdateSong()
    {
        WriteSubHeader("UPDATE SONG");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Song ID to update: ");
        var id = Console.ReadLine()!;

        Console.Write("New title (leave empty to skip): ");
        var title = Console.ReadLine();

        Console.Write("New artist (leave empty to skip): ");
        var artist = Console.ReadLine();

        Console.Write("Is public? (leave empty to skip, y/n): ");
        var isPublicInput = Console.ReadLine();
        bool? isPublic = null;
        if (!string.IsNullOrEmpty(isPublicInput))
        {
            isPublic = isPublicInput.ToLower() == "y";
        }

        var request = new
        {
            Title = string.IsNullOrEmpty(title) ? null : title,
            Artist = string.IsNullOrEmpty(artist) ? null : artist,
            IsPublic = isPublic
        };

        var response = await PutAsync($"/songs/{id}", request);

        if (response != null)
        {
            WriteSuccess("Song updated!");
            LogResponse(response);
        }
    }

    private static async Task TestDeleteSong()
    {
        WriteSubHeader("DELETE SONG");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Song ID to delete: ");
        var id = Console.ReadLine()!;

        try
        {
            await DeleteAsync($"/songs/{id}");
            WriteSuccess("Song deleted!");
        }
        catch (Exception ex)
        {
            WriteError($"Failed to delete: {ex.Message}");
        }
    }

    private static async Task TestBuildSongStructure()
    {
        WriteSubHeader("BUILD SONG STRUCTURE");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Song ID: ");
        var songId = Console.ReadLine()!;

        Console.Write("Number of segments: ");
        if (!int.TryParse(Console.ReadLine(), out int segmentCount))
        {
            WriteError("Invalid number");
            return;
        }

        var segments = new List<object>();

        for (int i = 0; i < segmentCount; i++)
        {
            Console.WriteLine($"\nSegment {i + 1}:");
            Console.Write("  Type (0-Text, 1-Playback, 2-Space, 3-Section): ");
            var type = Console.ReadLine()!;

            Console.Write("  Lyric (text): ");
            var lyric = Console.ReadLine();

            Console.Write("  Chord ID (optional): ");
            var chordId = Console.ReadLine();

            Console.Write("  Pattern ID (optional): ");
            var patternId = Console.ReadLine();

            segments.Add(new
            {
                Type = type,
                Lyric = string.IsNullOrEmpty(lyric) ? null : lyric,
                ChordId = string.IsNullOrEmpty(chordId) ? null : chordId,
                PatternId = string.IsNullOrEmpty(patternId) ? null : patternId
            });
        }

        var request = new
        {
            Segments = segments
        };

        var response = await PostAsync($"/songs/{songId}/structure", request);

        if (response != null)
        {
            WriteSuccess("Song structure built!");
            LogResponse(response);
        }
    }

    private static async Task TestAddChordToSong()
    {
        WriteSubHeader("ADD CHORD TO SONG");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Song ID: ");
        var songId = Console.ReadLine()!;

        Console.Write("Chord ID: ");
        var chordId = Console.ReadLine()!;

        var response = await PostAsync($"/songs/{songId}/chords/{chordId}", null);

        if (response != null)
        {
            WriteSuccess("Chord added to song!");
            LogResponse(response);
        }
    }

    private static async Task TestAddPatternToSong()
    {
        WriteSubHeader("ADD PATTERN TO SONG");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Song ID: ");
        var songId = Console.ReadLine()!;

        Console.Write("Pattern ID: ");
        var patternId = Console.ReadLine()!;

        var response = await PostAsync($"/songs/{songId}/patterns/{patternId}", null);

        if (response != null)
        {
            WriteSuccess("Pattern added to song!");
            LogResponse(response);
        }
    }

    #endregion

    #region Albums Tests

    private static async Task TestAlbums()
    {
        WriteHeader("ALBUMS TESTS");

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
        {
            {1, ("Search albums", TestSearchAlbums)},
            {2, ("Get album by ID", TestGetAlbumById)},
            {3, ("Get album with songs", TestGetAlbumWithSongs)},
            {4, ("Get user albums", TestGetUserAlbums)},
            {5, ("Get my albums", TestGetMyAlbums)},
            {6, ("Create album", TestCreateAlbum)},
            {7, ("Update album", TestUpdateAlbum)},
            {8, ("Delete album", TestDeleteAlbum)},
            {9, ("Add song to album", TestAddSongToAlbum)},
            {10, ("Remove song from album", TestRemoveSongFromAlbum)},
            {11, ("Favorite album", TestFavoriteAlbum)},
            {0, ("Back to main menu", async () => await Task.CompletedTask)}
        };

        await RunSubMenu(menu);
    }

    private static async Task TestSearchAlbums()
    {
        WriteSubHeader("SEARCH ALBUMS");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Search term (optional): ");
        var searchTerm = Console.ReadLine();

        var query = new List<string>();
        if (!string.IsNullOrEmpty(searchTerm)) query.Add($"searchTerm={Uri.EscapeDataString(searchTerm)}");
        query.Add("page=1");
        query.Add("pageSize=10");

        var response = await GetAsync("/albums?" + string.Join("&", query));

        if (response != null)
        {
            WriteSuccess("Albums retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetAlbumById()
    {
        WriteSubHeader("GET ALBUM BY ID");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Album ID: ");
        var id = Console.ReadLine()!;

        var response = await GetAsync($"/albums/{id}");

        if (response != null)
        {
            WriteSuccess("Album retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetAlbumWithSongs()
    {
        WriteSubHeader("GET ALBUM WITH SONGS");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Album ID: ");
        var id = Console.ReadLine()!;

        var response = await GetAsync($"/albums/{id}/with-songs");

        if (response != null)
        {
            WriteSuccess("Album with songs retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetUserAlbums()
    {
        WriteSubHeader("GET USER ALBUMS");

        if (!await EnsureAuthenticated()) return;

        Console.Write("User ID: ");
        var userId = Console.ReadLine()!;

        Console.Write("Include private? (y/n): ");
        var includePrivate = Console.ReadLine()?.ToLower() == "y";

        var response = await GetAsync($"/albums/user/{userId}?includePrivate={includePrivate}&page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("User albums retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetMyAlbums()
    {
        WriteSubHeader("GET MY ALBUMS");

        if (!await EnsureAuthenticated()) return;

        var response = await GetAsync("/albums/my-albums?includePrivate=true&page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("My albums retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestCreateAlbum()
    {
        WriteSubHeader("CREATE ALBUM");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Title: ");
        var title = Console.ReadLine()!;

        Console.Write("Is public? (y/n): ");
        var isPublic = Console.ReadLine()?.ToLower() == "y";

        Console.Write("Genre (optional): ");
        var genre = Console.ReadLine();

        Console.Write("Theme (optional): ");
        var theme = Console.ReadLine();

        Console.Write("Description (optional): ");
        var description = Console.ReadLine();

        var request = new
        {
            Title = title,
            IsPublic = isPublic,
            Genre = string.IsNullOrEmpty(genre) ? null : genre,
            Theme = string.IsNullOrEmpty(theme) ? null : theme,
            Description = string.IsNullOrEmpty(description) ? null : description
        };

        var response = await PostAsync("/albums", request);

        if (response != null)
        {
            WriteSuccess("Album created!");
            LogResponse(response);
        }
    }

    private static async Task TestUpdateAlbum()
    {
        WriteSubHeader("UPDATE ALBUM");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Album ID to update: ");
        var id = Console.ReadLine()!;

        Console.Write("New title (leave empty to skip): ");
        var title = Console.ReadLine();

        Console.Write("Is public? (leave empty to skip, y/n): ");
        var isPublicInput = Console.ReadLine();
        bool? isPublic = null;
        if (!string.IsNullOrEmpty(isPublicInput))
        {
            isPublic = isPublicInput.ToLower() == "y";
        }

        var request = new
        {
            Title = string.IsNullOrEmpty(title) ? null : title,
            IsPublic = isPublic
        };

        var response = await PutAsync($"/albums/{id}", request);

        if (response != null)
        {
            WriteSuccess("Album updated!");
            LogResponse(response);
        }
    }

    private static async Task TestDeleteAlbum()
    {
        WriteSubHeader("DELETE ALBUM");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Album ID to delete: ");
        var id = Console.ReadLine()!;

        try
        {
            await DeleteAsync($"/albums/{id}");
            WriteSuccess("Album deleted!");
        }
        catch (Exception ex)
        {
            WriteError($"Failed to delete: {ex.Message}");
        }
    }

    private static async Task TestAddSongToAlbum()
    {
        WriteSubHeader("ADD SONG TO ALBUM");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Album ID: ");
        var albumId = Console.ReadLine()!;

        Console.Write("Song ID: ");
        var songId = Console.ReadLine()!;

        var response = await PostAsync($"/albums/{albumId}/songs/{songId}", null);

        if (response != null)
        {
            WriteSuccess("Song added to album!");
            LogResponse(response);
        }
    }

    private static async Task TestRemoveSongFromAlbum()
    {
        WriteSubHeader("REMOVE SONG FROM ALBUM");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Album ID: ");
        var albumId = Console.ReadLine()!;

        Console.Write("Song ID: ");
        var songId = Console.ReadLine()!;

        try
        {
            await DeleteAsync($"/albums/{albumId}/songs/{songId}");
            WriteSuccess("Song removed from album!");
        }
        catch (Exception ex)
        {
            WriteError($"Failed to remove: {ex.Message}");
        }
    }

    private static async Task TestFavoriteAlbum()
    {
        WriteHeader("FAVORITE ALBUM TESTS");

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
        {
            {1, ("Get favorite album", TestGetFavoriteAlbum)},
            {2, ("Add song to favorite", TestAddSongToFavorite)},
            {3, ("Remove song from favorite", TestRemoveSongFromFavorite)},
            {0, ("Back to albums menu", async () => await Task.CompletedTask)}
        };

        await RunSubMenu(menu);
    }

    private static async Task TestGetFavoriteAlbum()
    {
        WriteSubHeader("GET FAVORITE ALBUM");

        if (!await EnsureAuthenticated()) return;

        var response = await GetAsync("/albums/favorite");

        if (response != null)
        {
            WriteSuccess("Favorite album retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestAddSongToFavorite()
    {
        WriteSubHeader("ADD SONG TO FAVORITE");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Song ID: ");
        var songId = Console.ReadLine()!;

        var response = await PostAsync($"/albums/favorite/{songId}", null);

        if (response != null)
        {
            WriteSuccess("Song added to favorites!");
            LogResponse(response);
        }
    }

    private static async Task TestRemoveSongFromFavorite()
    {
        WriteSubHeader("REMOVE SONG FROM FAVORITE");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Song ID: ");
        var songId = Console.ReadLine()!;

        try
        {
            await DeleteAsync($"/albums/favorite/{songId}");
            WriteSuccess("Song removed from favorites!");
        }
        catch (Exception ex)
        {
            WriteError($"Failed to remove: {ex.Message}");
        }
    }

    #endregion

    #region Reviews Tests

    private static async Task TestReviews()
    {
        WriteHeader("REVIEWS TESTS");

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
        {
            {1, ("Create review", TestCreateReview)},
            {2, ("Get review by ID", TestGetReview)},
            {3, ("Get song reviews", TestGetSongReviews)},
            {4, ("Update review", TestUpdateReview)},
            {5, ("Delete review", TestDeleteReview)},
            {0, ("Back to main menu", async () => await Task.CompletedTask)}
        };

        await RunSubMenu(menu);
    }

    private static async Task TestCreateReview()
    {
        WriteSubHeader("CREATE REVIEW");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Song ID: ");
        var songId = Console.ReadLine()!;

        Console.Write("Review text: ");
        var reviewText = Console.ReadLine()!;

        Console.Write("Beautiful level (1-5, optional): ");
        var beautifulInput = Console.ReadLine();
        int? beautifulLevel = null;
        if (int.TryParse(beautifulInput, out int b))
        {
            beautifulLevel = b;
        }

        Console.Write("Difficulty level (1-5, optional): ");
        var difficultyInput = Console.ReadLine();
        int? difficultyLevel = null;
        if (int.TryParse(difficultyInput, out int d))
        {
            difficultyLevel = d;
        }

        var request = new
        {
            ReviewText = reviewText,
            BeautifulLevel = beautifulLevel,
            DifficultyLevel = difficultyLevel
        };

        var response = await PostAsync($"/reviews/songs/{songId}", request);

        if (response != null)
        {
            WriteSuccess("Review created!");
            LogResponse(response);
        }
    }

    private static async Task TestGetReview()
    {
        WriteSubHeader("GET REVIEW BY ID");

        Console.Write("Review ID: ");
        var id = Console.ReadLine()!;

        var response = await GetAsync($"/reviews/{id}");

        if (response != null)
        {
            WriteSuccess("Review retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestGetSongReviews()
    {
        WriteSubHeader("GET SONG REVIEWS");

        Console.Write("Song ID: ");
        var songId = Console.ReadLine()!;

        var response = await GetAsync($"/reviews/songs/{songId}?page=1&pageSize=10");

        if (response != null)
        {
            WriteSuccess("Song reviews retrieved!");
            LogResponse(response);
        }
    }

    private static async Task TestUpdateReview()
    {
        WriteSubHeader("UPDATE REVIEW");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Review ID to update: ");
        var id = Console.ReadLine()!;

        Console.Write("New review text (leave empty to skip): ");
        var reviewText = Console.ReadLine();

        Console.Write("New beautiful level (1-5, leave empty to skip): ");
        var beautifulInput = Console.ReadLine();
        int? beautifulLevel = null;
        if (int.TryParse(beautifulInput, out int b))
        {
            beautifulLevel = b;
        }

        Console.Write("New difficulty level (1-5, leave empty to skip): ");
        var difficultyInput = Console.ReadLine();
        int? difficultyLevel = null;
        if (int.TryParse(difficultyInput, out int d))
        {
            difficultyLevel = d;
        }

        var request = new
        {
            ReviewText = string.IsNullOrEmpty(reviewText) ? null : reviewText,
            BeautifulLevel = beautifulLevel,
            DifficultyLevel = difficultyLevel
        };

        var response = await PutAsync($"/reviews/{id}", request);

        if (response != null)
        {
            WriteSuccess("Review updated!");
            LogResponse(response);
        }
    }

    private static async Task TestDeleteReview()
    {
        WriteSubHeader("DELETE REVIEW");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Review ID to delete: ");
        var id = Console.ReadLine()!;

        try
        {
            await DeleteAsync($"/reviews/{id}");
            WriteSuccess("Review deleted!");
        }
        catch (Exception ex)
        {
            WriteError($"Failed to delete: {ex.Message}");
        }
    }

    #endregion

    #region Subscriptions Tests (NEW!)

    private static async Task TestSubscriptions()
    {
        WriteHeader("SUBSCRIPTIONS TESTS (NEW!)");

        var menu = new Dictionary<int, (string Description, Func<Task> Action)>
        {
            {1, ("Get my subscriptions", TestGetMySubscriptions)},
            {2, ("Subscribe to user", TestSubscribeToUser)},
            {3, ("Unsubscribe from user", TestUnsubscribeFromUser)},
            {4, ("Subscribe to album", TestSubscribeToAlbum)},
            {5, ("Unsubscribe from album", TestUnsubscribeFromAlbum)},
            {6, ("Check subscription status", TestCheckSubscription)},
            {0, ("Back to main menu", async () => await Task.CompletedTask)}
        };

        await RunSubMenu(menu);
    }

    private static async Task TestGetMySubscriptions()
    {
        WriteSubHeader("GET MY SUBSCRIPTIONS");

        if (!await EnsureAuthenticated()) return;

        var response = await GetAsync("/subscriptions");

        if (response != null)
        {
            WriteSuccess("Subscriptions retrieved!");
            LogResponse(response);

            if (response is IEnumerable<object> subscriptions)
            {
                var table = new ConsoleTable("ID", "Type", "Name", "Since");
                foreach (var sub in subscriptions)
                {
                    var subObj = JsonConvert.DeserializeObject<dynamic>(JsonConvert.SerializeObject(sub))!;
                    table.AddRow(
                        subObj.id?.ToString()?[..8] + "...",
                        subObj.isUserSub ? "User" : "Album",
                        subObj.subName ?? "Unknown",
                        subObj.createdAt?.ToString()?[..10]
                    );
                }
                table.Write();
            }
        }
    }

    private static async Task TestSubscribeToUser()
    {
        WriteSubHeader("SUBSCRIBE TO USER");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Target User ID to subscribe to: ");
        var targetUserId = Console.ReadLine()!;

        var response = await PostAsync($"/subscriptions/users/{targetUserId}", null);

        if (response != null)
        {
            WriteSuccess("Subscribed to user!");
            LogResponse(response);
        }
    }

    private static async Task TestUnsubscribeFromUser()
    {
        WriteSubHeader("UNSUBSCRIBE FROM USER");

        if (!await EnsureAuthenticated()) return;

        Console.Write("User ID to unsubscribe from: ");
        var targetUserId = Console.ReadLine()!;

        try
        {
            await DeleteAsync($"/subscriptions/users/{targetUserId}");
            WriteSuccess("Unsubscribed from user!");
        }
        catch (Exception ex)
        {
            WriteError($"Failed to unsubscribe: {ex.Message}");
        }
    }

    private static async Task TestSubscribeToAlbum()
    {
        WriteSubHeader("SUBSCRIBE TO ALBUM");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Album ID to subscribe to: ");
        var albumId = Console.ReadLine()!;

        var response = await PostAsync($"/subscriptions/albums/{albumId}", null);

        if (response != null)
        {
            WriteSuccess("Subscribed to album!");
            LogResponse(response);
        }
    }

    private static async Task TestUnsubscribeFromAlbum()
    {
        WriteSubHeader("UNSUBSCRIBE FROM ALBUM");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Album ID to unsubscribe from: ");
        var albumId = Console.ReadLine()!;

        try
        {
            await DeleteAsync($"/subscriptions/albums/{albumId}");
            WriteSuccess("Unsubscribed from album!");
        }
        catch (Exception ex)
        {
            WriteError($"Failed to unsubscribe: {ex.Message}");
        }
    }

    private static async Task TestCheckSubscription()
    {
        WriteSubHeader("CHECK SUBSCRIPTION STATUS");

        if (!await EnsureAuthenticated()) return;

        Console.Write("Check subscription to (u - user, a - album): ");
        var type = Console.ReadLine()?.ToLower();

        if (type == "u")
        {
            Console.Write("User ID: ");
            var userId = Console.ReadLine()!;
            var response = await GetAsync($"/subscriptions/check/user/{userId}");
            WriteSuccess($"Subscribed: {response}");
        }
        else if (type == "a")
        {
            Console.Write("Album ID: ");
            var albumId = Console.ReadLine()!;
            var response = await GetAsync($"/subscriptions/check/album/{albumId}");
            WriteSuccess($"Subscribed: {response}");
        }
        else
        {
            WriteError("Invalid type");
        }
    }

    #endregion

    #region Premium Upgrade Tests (NEW!)

    private static async Task TestPremiumUpgrade()
    {
        WriteHeader("PREMIUM UPGRADE TESTS (NEW!)");

        if (!await EnsureAuthenticated()) return;

        Console.WriteLine("This will simulate a premium upgrade (no real payment)");
        Console.Write("Continue? (y/n): ");

        if (Console.ReadLine()?.ToLower() != "y")
        {
            return;
        }

        var request = new
        {
            PaymentMethod = "test_card",
            PaymentToken = "test_token_123"
        };

        var response = await PostAsync("/payments/upgrade-to-premium", request);

        if (response != null)
        {
            WriteSuccess("Premium upgrade successful!");
            LogResponse(response);

            // Refresh user info
            await TestGetProfile();
        }
    }

    #endregion

    #region Helper Methods

    private static async Task<dynamic?> GetAsync(string url)
    {
        return await SendRequestAsync(HttpMethod.Get, url);
    }

    private static async Task<dynamic?> PostAsync(string url, object? data)
    {
        return await SendRequestAsync(HttpMethod.Post, url, data);
    }

    private static async Task<dynamic?> PutAsync(string url, object? data)
    {
        return await SendRequestAsync(HttpMethod.Put, url, data);
    }

    private static async Task<dynamic?> DeleteAsync(string url)
    {
        return await SendRequestAsync(HttpMethod.Delete, url);
    }

    private static async Task<dynamic?> SendRequestAsync(HttpMethod method, string url, object? data = null)
    {
        try
        {
            var fullUrl = _baseUrl + url;
            var request = new HttpRequestMessage(method, fullUrl);

            if (!string.IsNullOrEmpty(_token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            }

            if (data != null && (method == HttpMethod.Post || method == HttpMethod.Put))
            {
                var json = JsonConvert.SerializeObject(data, new JsonSerializerSettings
                {
                    ContractResolver = new CamelCasePropertyNamesContractResolver(),
                    NullValueHandling = NullValueHandling.Ignore
                });
                request.Content = new StringContent(json, Encoding.UTF8, "application/json");

                Console.WriteLine($"Request Body: {json}");
            }

            Console.WriteLine($"\n{method} {fullUrl}");

            var response = await _httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"Status: {(int)response.StatusCode} {response.StatusCode}");

            if (!response.IsSuccessStatusCode)
            {
                WriteError($"Request failed: {content}");
                return null;
            }

            if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
            {
                return new { };
            }

            if (!string.IsNullOrEmpty(content))
            {
                return JsonConvert.DeserializeObject<dynamic>(content);
            }

            return new { };
        }
        catch (Exception ex)
        {
            WriteError($"Request error: {ex.Message}");
            return null;
        }
    }

    private static async Task<bool> EnsureAuthenticated()
    {
        if (string.IsNullOrEmpty(_token))
        {
            WriteError("You need to login first!");
            Console.WriteLine("\nPress any key to continue...");
            Console.ReadKey();
            return false;
        }
        return true;
    }

    private static async Task<bool> EnsureAdmin()
    {
        if (_currentUserRole != "Admin")
        {
            WriteError("This operation requires Admin privileges!");
            Console.WriteLine("\nPress any key to continue...");
            Console.ReadKey();
            return false;
        }
        return true;
    }

    private static void LogResponse(dynamic response)
    {
        Console.WriteLine("\nResponse:");
        Console.WriteLine(JsonConvert.SerializeObject(response, Formatting.Indented));
        Console.WriteLine();
    }

    private static void WriteHeader(string text)
    {
        Console.Clear();
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Magenta;
        Console.WriteLine($"╔══════════════════════════════════════╗");
        Console.WriteLine($"║ {text,-34} ║");
        Console.WriteLine($"╚══════════════════════════════════════╝");
        Console.ResetColor();
        Console.WriteLine();
    }

    private static void WriteSubHeader(string text)
    {
        Console.WriteLine();
        Console.ForegroundColor = ConsoleColor.Blue;
        Console.WriteLine($"▶ {text}");
        Console.ResetColor();
        Console.WriteLine(new string('─', 50));
    }

    private static void WriteSuccess(string text)
    {
        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"✓ {text}");
        Console.ResetColor();
    }

    private static void WriteError(string text)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"✗ {text}");
        Console.ResetColor();
    }

    private static async Task RunSubMenu(Dictionary<int, (string Description, Func<Task> Action)> menu)
    {
        while (true)
        {
            Console.WriteLine();
            foreach (var item in menu)
            {
                Console.WriteLine($"{item.Key,2}. {item.Value.Description}");
            }
            Console.Write("\nSelect option: ");

            var input = Console.ReadLine();
            if (int.TryParse(input, out int choice))
            {
                if (choice == 0)
                {
                    return;
                }

                if (menu.ContainsKey(choice))
                {
                    await menu[choice].Action();
                    Console.WriteLine("\nPress any key to continue...");
                    Console.ReadKey();
                }
                else
                {
                    WriteError("Invalid option");
                }
            }
        }
    }

    #endregion
}