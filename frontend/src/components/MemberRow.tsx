import { useState } from "react";
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxValue,
} from "./ui/combobox";
import { Input } from "./ui/input";
import type { GroupMemberInput } from "../pages/Dashboard";
import type { GroupMember } from "../context/group/groupcontext";

type MemberRowProps = {
    member: GroupMemberInput;
    allMembers: GroupMemberInput[];
    currentUser: GroupMember | null;
    onChange: (member: GroupMemberInput) => void;
    onRemove: () => void;
};

export function MemberRow({
    member,
    allMembers,
    currentUser,
    onChange,
    onRemove,
}: MemberRowProps) {

    const [searchQuery, setSearchQuery] = useState(member.name);

    const [memberSelect, setMemberSelect] = useState<GroupMemberInput | null>(
        member.friendId
            ? allMembers.find(
                  (user) => user.id === member.friendId
              ) ?? null
            : null
    );

    const filteredMembers = allMembers.filter((user) => {
        if (user.id === currentUser?.id) {
            return false;
        }

        return user.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
    });

    const handleMemberChange = (value: GroupMemberInput | null) => {
        setMemberSelect(value);

        if (value) {
            setSearchQuery(value.name);

            onChange({
                ...member,
                name: value.name,
                email: value.email ?? "",
                friendId: value.id,
            });
        }
    };

    return (
        <div
            className="
                flex items-center gap-2
                rounded-xl
                border border-white/8
                bg-white/2.5
                p-2
            "
        >
            {/* Name */}
            <div className="min-w-0 flex-1">
                <Combobox
                    items={filteredMembers}
                    value={memberSelect}
                    onValueChange={handleMemberChange}
                >
                    <ComboboxValue>
                        <ComboboxInput
                            value={
                                memberSelect
                                    ? memberSelect.name
                                    : searchQuery
                            }
                            placeholder="Name"
                            onChange={(e) => {
                                const value = e.target.value;

                                setSearchQuery(value);
                                setMemberSelect(null);

                                onChange({
                                    ...member,
                                    name: value,
                                    friendId: null,
                                });
                            }}
                            className="
                                h-10 rounded-lg
                                bg-white/2.5
                                border-white/8
                                text-sm text-white
                                placeholder:text-white/25
                                focus-within:border-emerald-400/40
                                focus-within:ring-2
                                focus-within:ring-emerald-400/10
                            "
                        />
                    </ComboboxValue>

                    <ComboboxContent
                        className="
                            border border-white/8
                            bg-zinc-900
                            shadow-2xl
                        "
                    >
                        <ComboboxEmpty className="text-white/40">
                            No member found.
                        </ComboboxEmpty>

                        <ComboboxList>
                            {(user: GroupMemberInput) => (
                                <ComboboxItem
                                    key={user.id}
                                    value={user}
                                    className="
                                        text-white/80
                                        rounded-lg
                                        data-highlighted:bg-white/8
                                        data-highlighted:text-white
                                    "
                                >
                                    {user.name}
                                </ComboboxItem>
                            )}
                        </ComboboxList>
                    </ComboboxContent>
                </Combobox>
            </div>


            <div className="min-w-0 flex-1">
                <Input
                    type="email"
                    placeholder="Email"
                    value={member.email}
                    disabled={!!memberSelect}
                    onChange={(e) => {
                        onChange({
                            ...member,
                            email: e.target.value,
                        });
                    }}
                    className="
                        h-10 rounded-lg
                        bg-white/4
                        border-white/8
                        text-sm text-white
                        placeholder:text-white/25
                        focus-visible:border-emerald-400/40
                        focus-visible:ring-2
                        focus-visible:ring-emerald-400/10
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                />
            </div>

            <button
                type="button"
                onClick={onRemove}
                className="
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-lg
                    text-white/30
                    transition-colors
                    hover:bg-red-500/10
                    hover:text-red-400
                "
            >
                ×
            </button>
        </div>
    );
}