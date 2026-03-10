'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Loader2,
  MoreHorizontal,
  Search,
  Filter,
  X,
  CheckCircle2,
  HardHat,
  Star,
} from 'lucide-react';
import { getTeamMembers, inviteMember } from '@/lib/server/team.actions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const fetchTeam = async () => {
    setIsLoading(true);
    const res = await getTeamMembers();
    if (res.members) setMembers(res.members);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const res = await inviteMember(
      formData.get('email') as string,
      formData.get('name') as string,
      formData.get('role') as any
    );

    if (res.success) {
      setInviteSuccess(true);
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setInviteSuccess(false);
        fetchTeam();
      }, 2000);
    } else {
      alert(res.error);
    }
    setIsSubmitting(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-zinc-950 text-white border-zinc-900';
      case 'chef_projet':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'superviseur':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default:
        return 'bg-zinc-50 text-zinc-600 border-zinc-100';
    }
  };

  return (
    <div className="animate-in fade-in space-y-10 pb-20 duration-500">
      {/* Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950">Team Management</h1>
          <p className="font-medium tracking-tight text-zinc-500">
            Manage administrative access and site supervisors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="group relative">
            <Search
              className="absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search members..."
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pr-6 pl-12 text-sm font-medium transition-all outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 md:w-72"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<UserPlus size={18} strokeWidth={3} />}
          >
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-zinc-950 p-8">
          <div className="mb-4 flex items-center gap-3">
            <Star className="text-zinc-950" size={20} />
            <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Administrators
            </span>
          </div>
          <p className="text-3xl font-black text-zinc-950">
            {members.filter((m) => m.role === 'admin').length}
          </p>
        </Card>
        <Card className="border-l-4 border-l-indigo-500 p-8">
          <div className="mb-4 flex items-center gap-3">
            <HardHat className="text-indigo-600" size={20} />
            <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Project Leads
            </span>
          </div>
          <p className="text-3xl font-black text-zinc-950">
            {members.filter((m) => m.role === 'chef_projet').length}
          </p>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 p-8">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="text-emerald-600" size={20} />
            <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              Supervisors
            </span>
          </div>
          <p className="text-3xl font-black text-zinc-950">
            {members.filter((m) => m.role === 'superviseur').length}
          </p>
        </Card>
      </div>

      {/* Team List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
          <Loader2 className="mb-4 animate-spin" size={40} />
          <p className="font-bold tracking-tight">Syncing team records...</p>
        </div>
      ) : (
        <Card className="shadow-premium overflow-hidden" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    User Profile
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    Role & Access
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    Assigned Sites
                  </th>
                  <th className="px-8 py-5 text-right text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="group transition-all duration-200 hover:bg-zinc-50/30"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-black text-zinc-900 shadow-sm transition-all duration-300 group-hover:bg-zinc-950 group-hover:text-white">
                          {member.nom_complet.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-black tracking-tight text-zinc-950">
                            {member.nom_complet}
                          </span>
                          <span className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 lowercase">
                            {member.id.slice(0, 12)}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={cn(
                          'rounded-full border px-3 py-1 text-[10px] font-black tracking-widest uppercase',
                          getRoleBadge(member.role)
                        )}
                      >
                        {member.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        <span className="text-sm font-black tracking-tight text-zinc-950">
                          {member.chantiers_assignes?.length || 0} Sites
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="rounded-xl border border-transparent p-2 text-zinc-300 shadow-sm transition-all hover:border-zinc-100 hover:bg-white hover:text-zinc-950">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm duration-300">
          <Card className="shadow-elevated w-full max-w-md overflow-hidden p-0" padding="none">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/30 p-10">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-zinc-950 p-2 text-white">
                  <UserPlus size={20} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black tracking-tight text-zinc-950">Invite Member</h2>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded-xl p-2 text-zinc-400 transition-all hover:bg-white hover:text-zinc-950"
              >
                <X size={24} />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="animate-in zoom-in space-y-4 p-20 text-center duration-300">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={40} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black text-zinc-950">Invitation Sent!</h3>
                <p className="font-medium text-zinc-500">
                  The link has been sent to the recipient's email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-8 p-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                      Full Name
                    </label>
                    <input
                      name="name"
                      required
                      placeholder="e.g. John Doe"
                      className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-zinc-950 focus:ring-8 focus:ring-zinc-950/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="john@example.com"
                      className="h-14 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 font-black text-zinc-950 transition-all outline-none focus:border-zinc-950 focus:ring-8 focus:ring-zinc-950/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                      Role Assignment
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        {
                          value: 'chef_projet',
                          label: 'Project Lead',
                          desc: 'Full site management access',
                        },
                        {
                          value: 'superviseur',
                          label: 'Supervisor',
                          desc: 'Daily logs & production only',
                        },
                        {
                          value: 'admin',
                          label: 'Administrator',
                          desc: 'Full business & financial access',
                        },
                      ].map((r) => (
                        <label key={r.value} className="group relative cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value={r.value}
                            required
                            className="peer sr-only"
                          />
                          <div className="rounded-2xl border border-zinc-200 bg-white p-5 transition-all group-hover:border-zinc-400 peer-checked:border-zinc-950 peer-checked:bg-zinc-950 peer-checked:text-white">
                            <p className="text-xs font-black tracking-widest uppercase">
                              {r.label}
                            </p>
                            <p className="mt-1 text-[10px] font-medium opacity-60">{r.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="h-16 w-full text-base font-black shadow-xl"
                >
                  Send Invitation
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
