import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateBrandVoice, type IUser } from "@/hooks/useUser";

const TONE_PRESETS: IUser["defaultTone"][] = [
  "professional",
  "casual",
  "luxury",
  "playful",
  "custom",
];

export function BrandVoicePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading || !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Keyed on the profile id so a different profile remounts with fresh state.
  return <BrandVoiceForm key={profile.id} profile={profile} />;
}

function BrandVoiceForm({ profile }: { profile: IUser }) {
  const updateBrandVoice = useUpdateBrandVoice();

  const [brandName, setBrandName] = useState(profile.brandName ?? "");
  const [tone, setTone] = useState<IUser["defaultTone"]>(
    profile.defaultTone ?? "professional"
  );
  const [customInstructions, setCustomInstructions] = useState(
    profile.customToneInstructions ?? ""
  );

  const handleSave = () => {
    updateBrandVoice.mutate(
      {
        brandName,
        defaultTone: tone,
        customToneInstructions: customInstructions,
      },
      {
        onSuccess: () => toast.success("Brand voice updated"),
        onError: () => toast.error("Failed to update brand voice"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand Voice</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set your default tone and style for generated descriptions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice settings</CardTitle>
          <CardDescription>
            These defaults apply to all new generations. You can override per
            generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand name</Label>
            <Input
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Your brand name"
            />
          </div>

          <div className="space-y-2">
            <Label>Default tone</Label>
            <div className="flex flex-wrap gap-2">
              {TONE_PRESETS.map((t) => (
                <Button
                  key={t}
                  variant={tone === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTone(t)}
                  className="capitalize"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customInstructions">Custom instructions</Label>
            <textarea
              id="customInstructions"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="E.g. Always mention sustainability. Keep sentences under 20 words."
              rows={4}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSave}
            disabled={updateBrandVoice.isPending}
          >
            {updateBrandVoice.isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
