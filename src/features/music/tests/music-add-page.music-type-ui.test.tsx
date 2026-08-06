import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { useEditorMock, routerPushMock } = vi.hoisted(() => ({
  useEditorMock: vi.fn(),
  routerPushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

vi.mock("@/app/(features)/(music)/music/actions", () => ({
  saveMusicAction: vi.fn(),
  deleteMusicAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("@tiptap/react", () => ({
  useEditor: useEditorMock,
  EditorContent: () => null,
}));

import { MusicAddPage } from "@/features/music/components/music-add-page";
import type { MemberKeyDetails } from "@/features/family/types/family-steps";
import type { MusicRecord, MusicTagOption, MusicTemplateOption } from "@/components/db/types/music";

function createEditorStub() {
  const chain = {
    focus: vi.fn(),
    toggleHeading: vi.fn(),
    toggleBold: vi.fn(),
    toggleItalic: vi.fn(),
    toggleUnderline: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleOrderedList: vi.fn(),
    extendMarkRange: vi.fn(),
    unsetLink: vi.fn(),
    setLink: vi.fn(),
    setHorizontalRule: vi.fn(),
    insertTable: vi.fn(),
    addRowAfter: vi.fn(),
    addColumnAfter: vi.fn(),
    deleteTable: vi.fn(),
    run: vi.fn(),
  };

  chain.focus.mockReturnValue(chain);
  chain.toggleHeading.mockReturnValue(chain);
  chain.toggleBold.mockReturnValue(chain);
  chain.toggleItalic.mockReturnValue(chain);
  chain.toggleUnderline.mockReturnValue(chain);
  chain.toggleBulletList.mockReturnValue(chain);
  chain.toggleOrderedList.mockReturnValue(chain);
  chain.extendMarkRange.mockReturnValue(chain);
  chain.unsetLink.mockReturnValue(chain);
  chain.setLink.mockReturnValue(chain);
  chain.setHorizontalRule.mockReturnValue(chain);
  chain.insertTable.mockReturnValue(chain);
  chain.addRowAfter.mockReturnValue(chain);
  chain.addColumnAfter.mockReturnValue(chain);
  chain.deleteTable.mockReturnValue(chain);
  chain.run.mockReturnValue(true);

  return {
    chain: () => chain,
    can: () => ({ chain: () => chain }),
    isActive: () => false,
    getAttributes: () => ({}),
    getJSON: () => ({ type: "doc", content: [] }),
    commands: {
      setContent: vi.fn(),
    },
  };
}

const member: MemberKeyDetails = {
  isLoggedIn: true,
  email: "member@example.com",
  isFounder: false,
  isAdmin: false,
  firstName: "Taylor",
  lastName: "West",
  familyId: 10,
  familyName: "West Family",
  memberId: 99,
};

const musicTags: MusicTagOption[] = [
  {
    id: 1,
    tagName: "Pop",
    tagDesc: null,
    tagType: "genre",
    status: "published",
    seqNo: 1,
  },
  {
    id: 2,
    tagName: "Indie",
    tagDesc: null,
    tagType: "subGenre",
    status: "published",
    seqNo: 1,
  },
];

const musicTemplates: MusicTemplateOption[] = [
  {
    id: 11,
    templateName: "Standard Music Review",
    isGlobalTemplate: true,
    status: "published",
    templateJson: '{"type":"doc","content":[]}',
    memberId: null,
    familyId: 1,
    label: "Standard Music Review",
  },
];

function buildMusicRecord(overrides: Partial<MusicRecord>): MusicRecord {
  return {
    id: 500,
    musicTitle: "Record",
    artistName: "Some Artist",
    musicJson: '{"type":"doc","content":[]}',
    status: "published",
    musicType: "album",
    musicImageUrl: null,
    hasLyrics: false,
    musicDebutYear: 2026,
    updatedAt: new Date("2026-08-05T12:00:00.000Z"),
    memberId: 99,
    familyId: 10,
    submitterName: "Taylor West",
    submitterLikenessDegree: null,
    commentCount: 0,
    noRatingCount: 0,
    thumbsUpCount: 0,
    loveCount: 0,
    likedByMember: false,
    likenessDegree: null,
    selectedTagIds: [],
    tagNamesByType: {},
    playlistMedia: [],
    discussionThreads: [],
    hasDiscussionThread: false,
    ...overrides,
  };
}

describe("MusicAddPage music type UI", () => {
  beforeEach(() => {
    useEditorMock.mockReset();
    routerPushMock.mockReset();
    useEditorMock.mockImplementation(() => createEditorStub());
  });

  it("shows playlist media editor when editing a playlist", () => {
    const playlistMusic = buildMusicRecord({
      musicType: "playlist",
      musicTitle: "Weekend Mix",
      playlistMedia: [
        {
          id: 1,
          musicId: 500,
          mediaSource: "spotify",
          mediaSeqNo: 1,
          mediaType: "song",
          mediaUrl: "https://open.spotify.com/track/abc",
          mediaArtist: "Aster Lake",
          mediaCaption: "Late night drive",
          createdAt: new Date("2026-08-05T12:00:00.000Z"),
        },
      ],
    });

    const html = renderToStaticMarkup(
      <MusicAddPage
        musicTags={ musicTags }
        musicTemplates={ musicTemplates }
        member={ member }
        initialMusic={ playlistMusic }
        mode="edit"
      />,
    );

    expect(html).toContain("Music Type");
    expect(html).toContain("Playlist Media");
    expect(html).toContain("Playlist Title");
    expect(html).not.toContain("Media 1");
    expect(html).not.toContain("id=\"artist-name\"");
    expect(html).not.toContain("Debut Year");
    expect(html).not.toContain("Templates are not used for playlist entries.");
  });

  it("does not include artist as an available music type option", () => {
    const html = renderToStaticMarkup(
      <MusicAddPage
        musicTags={ musicTags }
        musicTemplates={ musicTemplates }
        member={ member }
        mode="add"
      />,
    );

    expect(html).toContain("Music Type");
    expect(html).not.toContain('value="artist"');
  });
});
