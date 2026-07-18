export type Gender = 'male' | 'female' | 'other';

export interface Member {
    id: number;
    name: string;
    surname: string | null;
    date_of_birth: string | null;
    date_of_death: string | null;
    profession: string | null;
    description: string | null;
    gender: Gender | null;
    birth_place: string | null;
    death_place: string | null;
    photo_url: string | null;
    created_at?: string;
    updated_at?: string;
}

export type RelationshipType = 'parent' | 'spouse';

export interface Relationship {
    id: number;
    from_member_id: number;
    to_member_id: number;
    type: RelationshipType;
}

export type MemberSummary = Pick<Member, 'id' | 'name' | 'surname' | 'photo_url'>;

export interface GalleryItem {
    id: number;
    image_url: string;
    description: string | null;
    members: MemberSummary[];
    created_at?: string;
}
