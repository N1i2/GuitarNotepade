"use client";

import React, {
  useState,
  useRef,
  useEffect,
  Suspense,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Upload, X, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAlbumSchema,
  CreateAlbumFormValues,
  genres,
  themes,
} from "@/lib/validations/album";
import { UpdateAlbumDto } from "@/types/albom";
import { AlbumService } from "@/lib/api/albom-service";
import { ConfirmDialog } from "@/components/alboms/confirm-dialog";

function EditAlbumPageContent({ albumId }: { albumId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [albumData, setAlbumData] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [initialFormValues, setInitialFormValues] =
    useState<CreateAlbumFormValues | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    reset,
    getValues,
  } = useForm<CreateAlbumFormValues>({
    resolver: zodResolver(createAlbumSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      genre: "",
      theme: "",
      description: "",
      isPublic: false,
    },
  });

  const currentValues = watch();

  const hasFormChanges = useCallback(() => {
    if (!initialFormValues) return false;

    const current = getValues();
    return (
      current.title !== initialFormValues.title ||
      current.genre !== initialFormValues.genre ||
      current.theme !== initialFormValues.theme ||
      current.description !== initialFormValues.description ||
      current.isPublic !== initialFormValues.isPublic ||
      selectedImage !== null ||
      (imagePreview && imagePreview !== albumData?.coverUrl && !selectedImage)
    );
  }, [initialFormValues, getValues, selectedImage, imagePreview, albumData]);

  const fetchAlbumData = useCallback(async () => {
    if (hasFetched) return;

    setIsLoading(true);
    try {
      const album = await AlbumService.getAlbumById(albumId);
      setAlbumData(album);

      const initialValues = {
        title: album.title,
        genre: album.genre || "",
        theme: album.theme || "",
        description: album.description || "",
        isPublic: album.isPublic,
      };

      reset(initialValues);
      setInitialFormValues(initialValues);

      if (album.coverUrl) {
        if (album.coverUrl.startsWith("data:image/")) {
          setImagePreview(album.coverUrl);
        } else {
          try {
            const coverBase64 = await AlbumService.getAlbumCoverBase64(
              album.coverUrl,
            );
            setImagePreview(coverBase64);
          } catch (error) {
            console.error("Failed to load cover image:", error);
          }
        }
      }

      setHasFetched(true);
    } catch (error: unknown) {
      const isApiError =
        error && typeof error === "object" && "status" in error;

      if (isApiError) {
        const apiError = error as { status: number; message?: string };
        if (apiError.status === 404) {
          toast.error("Album not found");
          router.push("/home/albums");
        } else {
          toast.error(apiError.message || "Failed to load album");
        }
      } else if (error instanceof Error) {
        toast.error(error.message || "Failed to load album");
      } else {
        toast.error("Failed to load album");
      }
    } finally {
      setIsLoading(false);
    }
  }, [albumId, router, toast, reset, hasFetched]);

  useEffect(() => {
    fetchAlbumData();
  }, [fetchAlbumData]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const convertImageToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const onSubmit = async (data: CreateAlbumFormValues) => {
    if (!albumData || !hasFormChanges()) {
      toast.info("No changes detected");
      return;
    }

    setIsLoading(true);
    try {
      let coverUrl: string | undefined = undefined;

      if (selectedImage) {
        coverUrl = await convertImageToBase64(selectedImage);
      } else if (imagePreview && imagePreview.startsWith("data:image/")) {
        coverUrl = imagePreview;
      }

      const updateAlbumDto: UpdateAlbumDto = {};

      if (data.title !== albumData.title) {
        updateAlbumDto.title = data.title;
      }

      if (data.isPublic !== albumData.isPublic) {
        updateAlbumDto.isPublic = data.isPublic;
      }

      if (data.genre !== albumData.genre) {
        updateAlbumDto.genre = data.genre || undefined;
      }

      if (data.theme !== albumData.theme) {
        updateAlbumDto.theme = data.theme || undefined;
      }

      if (data.description !== albumData.description) {
        updateAlbumDto.description = data.description || undefined;
      }

      if (coverUrl !== undefined) {
        updateAlbumDto.coverUrl = coverUrl;
      }

      if (Object.keys(updateAlbumDto).length === 0) {
        toast.info("No changes to save");
        return;
      }

      const updatedAlbum = await AlbumService.updateAlbum(
        albumId,
        updateAlbumDto,
      );

      toast.success(`Album "${updatedAlbum.title}" updated successfully!`);

      router.push(`/home/albums/${albumId}`);
    } catch (error: unknown) {
      const isApiError =
        error && typeof error === "object" && "status" in error;

      if (isApiError) {
        const apiError = error as { status: number; message?: string };
        if (apiError.status === 409) {
          toast.error("You already have an album with this title");
        } else {
          toast.error(apiError.message || "Failed to update album");
        }
      } else if (error instanceof Error) {
        toast.error(error.message || "Failed to update album");
      } else {
        toast.error("Failed to update album");
      }
      setIsLoading(false);
    }
  };

  const handleIsPublicChange = (checked: boolean) => {
    setValue("isPublic", checked, { shouldValidate: true });
  };

  if (isLoading && !albumData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Album not found</h2>
          <Button onClick={() => router.push("/home/albums")}>
            Back to Albums
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/home/albums/${albumId}`)}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Album
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Album</h1>
            <p className="text-muted-foreground mt-2">
              Edit your album information
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Album Details</CardTitle>
                  <CardDescription>Edit album information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Album Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., My Favorite Songs, Summer Vibes"
                      {...register("title", { required: true })}
                      aria-invalid={!!errors.title}
                    />
                    {errors.title && (
                      <span className="text-sm text-red-500">
                        {errors.title.message}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="genre">Genre (Optional)</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue("genre", value === "None" ? "" : value, {
                            shouldValidate: true,
                          })
                        }
                        value={currentValues.genre || "None"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          {genres.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.genre && (
                        <span className="text-sm text-red-500">
                          {errors.genre.message}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme (Optional)</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue("theme", value === "None" ? "" : value, {
                            shouldValidate: true,
                          })
                        }
                        value={currentValues.theme || "None"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          {themes.map((theme) => (
                            <SelectItem key={theme} value={theme}>
                              {theme}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.theme && (
                        <span className="text-sm text-red-500">
                          {errors.theme.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover">Cover Image (Optional)</Label>
                    <div className="space-y-4">
                      {!imagePreview ? (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <Upload className="h-12 w-12 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">
                                Drag & drop or click to upload
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Select File
                            </Button>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="relative w-full aspect-square max-w-[400px] mx-auto border rounded-lg overflow-hidden">
                            <img
                              src={imagePreview}
                              alt="Album cover preview"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8"
                              onClick={removeSelectedImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500 text-center mt-2">
                            {selectedImage?.name ? (
                              <>
                                {selectedImage.name} (
                                {Math.round(selectedImage.size / 1024)} KB)
                              </>
                            ) : (
                              "Current album cover"
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your album..."
                      className="min-h-[120px]"
                      {...register("description")}
                    />
                    <div className="flex justify-between">
                      {errors.description && (
                        <span className="text-sm text-red-500">
                          {errors.description.message}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {currentValues.description?.length || 0}/2000 characters
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="isPublic">Album Visibility *</Label>
                      <p className="text-sm text-muted-foreground">
                        {currentValues.isPublic
                          ? "Album will be visible to everyone"
                          : "Album will be private (only you can see it)"}
                      </p>
                    </div>
                    <Switch
                      id="isPublic"
                      checked={currentValues.isPublic}
                      onCheckedChange={handleIsPublicChange}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>How your album will appear</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-full aspect-square max-w-[300px] border rounded-lg overflow-hidden">
                      {imagePreview ? (
                        <>
                          <div className="absolute inset-0 z-0">
                            <img
                              src={imagePreview}
                              alt="Album cover preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                          </div>
                          <div className="absolute top-2 right-2 w-12 h-12 rounded-md overflow-hidden border-2 border-white/30 shadow-lg z-10">
                            <img
                              src={imagePreview}
                              alt="Album cover preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-linear-to-br from-blue-400 to-purple-500">
                          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                            <span className="text-white text-2xl font-bold">
                              {currentValues.title
                                ? currentValues.title.charAt(0).toUpperCase()
                                : "A"}
                            </span>
                          </div>
                          <p className="text-sm text-white/80 text-center">
                            {currentValues.title
                              ? "Album cover will appear here"
                              : "No album title yet"}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold text-lg">
                        {currentValues.title || "Untitled Album"}
                      </h3>
                      {(currentValues.genre || currentValues.theme) &&
                        currentValues.genre !== "None" &&
                        currentValues.theme !== "None" && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {currentValues.genre &&
                              currentValues.genre !== "" &&
                              currentValues.genre !== "None" && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                  {currentValues.genre}
                                </span>
                              )}
                            {currentValues.theme &&
                              currentValues.theme !== "" &&
                              currentValues.theme !== "None" && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                  {currentValues.theme}
                                </span>
                              )}
                          </div>
                        )}
                      <p className="text-sm text-muted-foreground">
                        {currentValues.isPublic
                          ? "Public Album"
                          : "Private Album"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/home/albums/${albumId}`)}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !isValid || !hasFormChanges()}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditAlbumPage({
  params,
}: {
  params: Promise<{ albumId: string }>;
}) {
  const resolvedParams = React.use(params);
  const albumId = resolvedParams.albumId;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      }
    >
      <EditAlbumPageContent albumId={albumId} />
    </Suspense>
  );
}
