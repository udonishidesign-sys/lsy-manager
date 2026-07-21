"use client";

import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

type Props = {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
};

export default function CustomTimePicker({ label, value, onChange }: Props) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-500 mb-1">{label}</span>

      <div className="relative h-12">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TimePicker
            className="rblock w-full rounded-lg bg-teal-50 leading-12 px-3 text-base text-slate-700
            outline-none appearance-none disabled:bg-slate-100 disabled:text-slate-400"
            value={value}
            onChange={onChange}
            ampm={false}
            minutesStep={1}
            views={["hours", "minutes"]}
            format="--:--"
            slotProps={{
              textField: {
                size: "small",
                sx: {
                  width: "100%",

                  "& .MuiPickersOutlinedInput-root": {
                    height: "48px",
                    borderRadius: "0.5rem",
                    backgroundColor: "transparent",
                    border: "1px solid #00bba7",

                    "& fieldset": {
                      border: "none",
                    },

                    "&:hover fieldset": {
                      border: "none",
                    },

                    "&.Mui-focused fieldset": {
                      border: "none",
                    },
                  },

                  "& .MuiPickersSectionList-sectionContent": {
                    fontSize: "1rem",
                    color: "#334155",
                  },

                  "& .MuiInputAdornment-root button": {
                    color: "#64748b",
                  },
                },
              },
            }}
          />
        </LocalizationProvider>
        /
      </div>
    </label>
  );
}
