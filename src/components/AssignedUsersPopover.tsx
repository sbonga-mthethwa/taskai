import { useState } from "react";
import { Users } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { TeamMember } from "@/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AssignedUsersPopoverProps {
  userIds: string[];
  onMemberClick?: (member: TeamMember) => void;
}

const AssignedUsersPopover = ({ userIds, onMemberClick }: AssignedUsersPopoverProps) => {
  const { users: teamMembers } = useData();
  const members = teamMembers.filter(m => userIds.includes(m.id));
  if (members.length === 0) return null;

  const maxShow = 3;
  const visible = members.slice(0, maxShow);
  const extra = members.length - maxShow;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={e => e.stopPropagation()}
          className="flex items-center -space-x-1.5 group"
          title={`${members.length} assigned`}
        >
          {visible.map(m => (
            m.avatar ? (
              <img
                key={m.id}
                src={m.avatar}
                alt={m.name}
                className="w-6 h-6 rounded-full border-2 border-card object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div
                key={m.id}
                className="w-6 h-6 rounded-full border-2 border-card bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold transition-transform group-hover:scale-105"
              >
                {m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            )
          ))}
          {extra > 0 && (
            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] font-semibold border-2 border-card">
              +{extra}
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="start"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1.5 mb-1 border-b border-border">
          Assigned Users
        </p>
        <div className="space-y-0.5">
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => onMemberClick?.(m)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm hover:bg-muted/50 transition-colors"
            >
              {m.avatar ? (
                <img src={m.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                  {m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
              )}
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">{m.department}</p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AssignedUsersPopover;
